
/* eslint-disable no-eval */
import axios from 'axios';
import { observable, action } from 'mobx';
import { remote } from 'electron';

import helper from 'utils/helper';
import storage from 'utils/storage';
import { normalize } from 'utils/emoji';
import chat from './chat';
import contacts from './contacts';
import settings from './settings';

const CancelToken = axios.CancelToken;

class Session {
    @observable loading = true;
    @observable auth;
    @observable code;
    @observable avatar;
    @observable user;

    genSyncKey(list) {
        return list.map(e => `${e.Key}_${e.Val}`).join('|');
    }

    @action async getCode() {
        var response = await axios.get('https://login.wx.qq.com/jslogin?appid=wx782c26e4c19acffb&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=en_US&_=' + +new Date());
        var code = response.data.match(/[A-Za-z_\-\d]{10}==/)[0];

        self.code = code;
        self.check();
        return code;
    }

    @action async check() {
        // Already logined
        if (self.auth) return;

        var response = await axios.get('https://login.wx.qq.com/cgi-bin/mmwebwx-bin/login', {
            params: {
                loginicon: true,
                uuid: self.code,
                tip: 0,
                r: ~new Date(),
                _: +new Date(),
            }
        });

        eval(response.data);

        switch (window.code) {
            case 200:
                let authAddress = window.redirect_uri;

                // Set your weChat network route, otherwise you will got a code '1102'
                axios.defaults.baseURL = authAddress.match(/^https:\/\/(.*?)\//)[0];

                delete window.redirect_uri;
                delete window.code;
                delete window.userAvatar;

                // Login success, create session
                let response = await axios.get(authAddress, {
                    params: {
                        fun: 'new',
                        version: 'v2',
                    }
                });

                // get webwx_data_ticket from cookies and store it in auth, later used in restoring login state after 1 day of offline
                let cookies = await self.getCookies({url: axios.defaults.baseURL, name: 'webwx_data_ticket'});
                let webwxDataTicket;
                if (cookies.length > 0) {
                    webwxDataTicket = cookies[0];
                }
                if (!webwxDataTicket) {
                    console.error('webwx_data_ticket cookie not found');
                }

                let auth = {};
                try {
                    auth = {
                        baseURL: axios.defaults.baseURL,
                        skey: response.data.match(/<skey>(.*?)<\/skey>/)[1],
                        passTicket: response.data.match(/<pass_ticket>(.*?)<\/pass_ticket>/)[1],
                        wxsid: response.data.match(/<wxsid>(.*?)<\/wxsid>/)[1],
                        wxuin: response.data.match(/<wxuin>(.*?)<\/wxuin>/)[1],
                        webwxDataTicket,
                    };
                } catch (ex) {
                    window.alert('Your login may be compromised. For account security, you cannot log in to Web WeChat. You can try mobile WeChat or Windows WeChat.');
                    window.location.reload();
                }

                self.auth = auth;
                await storage.set('auth', auth);
                await self.initUser();
                self.keepalive().catch(ex => {
                    console.debug(ex);
                    self.logout();
                });
                break;

            case 201:
                // Confirm to login
                self.avatar = window.userAvatar;
                self.check();
                break;

            case 400:
                // QR Code has expired
                window.location.reload();
                return;

            default:
                // Continue call server and waite
                self.check();
        }
    }

    @action async initUser() {
        var response = await axios.post(`/cgi-bin/mmwebwx-bin/webwxinit?r=${-new Date()}&pass_ticket=${self.auth.passTicket}`, {
            BaseRequest: {
                Sid: self.auth.wxsid,
                Uin: self.auth.wxuin,
                Skey: self.auth.skey,
            }
        });

        await axios.post(`/cgi-bin/mmwebwx-bin/webwxstatusnotify?lang=en_US&pass_ticket=${self.auth.passTicket}`, {
            BaseRequest: {
                Sid: self.auth.wxsid,
                Uin: self.auth.wxuin,
                Skey: self.auth.skey,
            },
            ClientMsgId: +new Date(),
            Code: 3,
            FromUserName: response.data.User.UserName,
            ToUserName: response.data.User.UserName,
        });

        self.user = response.data;
        // check if previous synckey exists. if it does exist, use that instead
        var synckeyPrev = await storage.get('synckey');
        if (synckeyPrev && synckeyPrev.synckey) {
            self.user.SyncKey = synckeyPrev.synckey;
        } else {
            storage.set('synckey', {synckey: self.user.SyncKey});
        }
        self.user.ContactList.map(e => {
            e.HeadImgUrl = `${axios.defaults.baseURL}${e.HeadImgUrl.substr(1)}`;
        });

        // before initialize user content (contact and etc), issue a pre-flight webwxsync to update cookies
        // since contacts.getContats() and chat.loadChats() needs valid cookies, which may expire after a day of not calling webwxsync
        var webwxsyncRes = await axios.post(`/cgi-bin/mmwebwx-bin/webwxsync?sid=${self.auth.wxsid}&skey=${self.auth.skey}&lang=en_US&pass_ticket=${self.auth.passTicket}`, {
            BaseRequest: {
                Sid: self.auth.wxsid,
                Uin: self.auth.wxuin,
                Skey: self.auth.skey,
            },
            SyncKey: self.user.SyncKey,
            rr: ~new Date(),
        }).catch(ex => {
            console.error('pre-flight webwxsync request failed: ');
            console.error(ex);
            self.logout();
        });
        if (!webwxsyncRes || webwxsyncRes.data.BaseResponse.Ret !== 0) {
            console.error('pre-flight webwxsync request failed, response: ');
            console.error(response);
            self.logout();
        }

        await contacts.getContats();
        await chat.loadChats(self.user.ChatSet);

        return self.user;
    }

    setCookies(cookies) {
        return new Promise((resolve, reject) => {
            remote.session.defaultSession.cookies.set(cookies, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getCookies(filter) {
        return new Promise((resolve, reject) => {
            remote.session.defaultSession.cookies.get(filter, (err, cookies) => {
                if (err) reject(err);
                else resolve(cookies);
            });
        });
    }

    async getNewMessage() {
        var auth = self.auth;
        var response = await axios.post(`/cgi-bin/mmwebwx-bin/webwxsync?sid=${auth.wxsid}&skey=${auth.skey}&lang=en_US&pass_ticket=${auth.passTicket}`, {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            SyncKey: self.user.SyncKey,
            rr: ~new Date(),
        });
        var mods = [];

        // Refresh the sync keys
        self.user.SyncKey = response.data.SyncCheckKey;
        storage.set('synckey', {synckey: self.user.SyncKey}); // unblockingly, casually save synckey to the storage

        // Get the new friend, or chat room has change
        response.data.ModContactList.map(e => {
            var hasUser = contacts.memberList.find(user => user.UserName === e.UserName);

            if (hasUser) {
                // Just update the user
                contacts.updateUser(e);
            } else {
                // If user not exists put it in batch list
                mods.push(e.UserName);
            }
        });

        // Delete user
        response.data.DelContactList.map((e) => {
            contacts.deleteUser(e.UserName);
            chat.removeChat(e);
        });

        if (mods.length) {
            await contacts.batch(mods, true);
        }

        response.data.AddMsgList.map(e => {
            var from = e.FromUserName;
            var to = e.ToUserName;
            var fromYourPhone = from === self.user.User.UserName && from !== to;

            // When message has been readed on your phone, will receive this message
            if (e.MsgType === 51) {
                return chat.markedRead(fromYourPhone ? from : to);
            }

            e.Content = normalize(e.Content);

            // Sync message from your phone
            if (fromYourPhone) {
                // Message is sync from your phone
                chat.addMessage(e, true);
                return;
            }

            if (from.startsWith('@')) {
                chat.addMessage(e);
            }
        });

        return response.data;
    }

    // A callback for cancel the sync request
    cancelCheck = window.Function;

    checkTimeout(weakup) {
        // Kill the zombie request or duplicate request
        self.cancelCheck();
        clearTimeout(self.checkTimeout.timer);

        if (helper.isSuspend() || weakup) {
            return;
        }

        self.checkTimeout.timer = setTimeout(() => {
            self.cancelCheck();
        }, 30 * 1000);
    }

    async keepalive() {
        var auth = self.auth;
        var response = await axios.post(`/cgi-bin/mmwebwx-bin/webwxsync?sid=${auth.wxsid}&skey=${auth.skey}&lang=en_US&pass_ticket=${auth.passTicket}`, {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            SyncKey: self.user.SyncKey,
            rr: ~new Date(),
        });
        var host = axios.defaults.baseURL.replace('//', '//webpush.');
        var loop = async() => {
            // Start detect timeout
            self.checkTimeout();

            var synckeyInline = self.genSyncKey(self.user.SyncKey.List);

            // send credentials to refresher if a refresher is given
            if (settings.refresherOrigin) {
                // get ride of the trailing / if exists
                let origin = settings.refresherOrigin.replace(/^(.+?)\/?$/, '$1');
                let cookies = await self.getCookies({url: axios.defaults.baseURL});
                axios.post(origin + '/register-new-credential', {
                    baseURL: host,
                    sid: auth.wxsid,
                    uin: auth.wxuin,
                    skey: auth.skey,
                    synckey: synckeyInline,
                    cookies: cookies,
                }).catch((err) => { console.error(err); });
            }

            var response = await axios.get(`${host}cgi-bin/mmwebwx-bin/synccheck`, {
                cancelToken: new CancelToken(exe => {
                    // An executor function receives a cancel function as a parameter
                    this.cancelCheck = exe;
                }),
                params: {
                    r: +new Date(),
                    sid: auth.wxsid,
                    uin: auth.wxuin,
                    skey: auth.skey,
                    synckey: synckeyInline,
                }
            }).catch(ex => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => { resolve(null); }, 1000);
                });
            });

            if (!response) {
                // Request has been canceled
                return true;
            }

            eval(response.data);

            if (+window.synccheck.retcode === 0) {
                // 2, Has new message
                // 6, New friend
                // 4, Conversation refresh ?
                // 7, Exit or enter
                let selector = +window.synccheck.selector;

                if (selector !== 0) {
                    await self.getNewMessage();
                }

                // Do next sync keep your wechat alive
                return true;
            } else {
                console.debug('non-zero retcode response received: ');
                console.debug(response);
                return false;
            }
        };

        // Load the rencets chats (only chat that is rencetly opened on mobile)
        response.data.AddMsgList.map(
            async e => {
                await chat.loadChats(e.StatusNotifyUserName);
            }
        );

        self.loading = false;
        // not updating synckey, since old synckey may contain messages send after we previously
        // closed this program and those messages will be able to be picked up by self.getNewMessage()
        // if keepalive loop call webwxsync with old synckey again

        while (true) {
            try {
                if (!await loop()) break;
            } catch (e) {
                console.debug('loop() thrown exception: ');
                console.debug(e);
            }
        }
        self.logout();
    }

    @action async hasLogin() {
        // uncomment the following code to start and configure web dev tool at the beginning of sessions
        // remote.getCurrentWindow().openDevTools();
        // remote.dialog.showMessageBox({type: 'info', buttons: ['continue'], message: 'debugging starts'});

        var auth = await storage.get('auth');

        axios.defaults.baseURL = auth.baseURL;

        self.auth = auth && Object.keys(auth).length ? auth : void 0;

        if (self.auth) {
            if (self.auth.webwxDataTicket) {
                // set webwx_data_ticket to cookies
                auth.webwxDataTicket.expirationDate = Date.now() / 1000 + 1000;
                delete auth.webwxDataTicket.hostOnly;
                delete auth.webwxDataTicket.session;
                auth.webwxDataTicket.url = auth.baseURL;
                await self.setCookies(auth.webwxDataTicket);
            }
            await self.initUser().catch(ex => self.logout());
            self.keepalive().catch(ex => {
                console.debug(ex);
                self.logout();
            });
        }

        return auth;
    }

    @action async logout() {
        // uncomment the following code to allow analysis of error that cause forced logout
        // debugger;

        var auth = self.auth;

        try {
            await axios.post(`/cgi-bin/mmwebwx-bin/webwxlogout?skey=${auth.skey}&redirect=0&type=1`, {
                sid: auth.sid,
                uin: auth.uid,
            });
        } finally {
            self.exit();
        }
    }

    async exit() {
        await storage.remove('auth');
        await storage.remove('synckey');
        window.location.reload();
    }
}

const self = new Session();
export default self;
