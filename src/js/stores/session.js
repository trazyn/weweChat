
/* eslint-disable no-eval */
import axios from 'axios';
import { observable, action } from 'mobx';

import helper from 'utils/helper';
import storage from 'utils/storage';
import { normalize } from 'utils/emoji';
import chat from './chat';
import contacts from './contacts';

const CancelToken = axios.CancelToken;
const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
    'client-version': '1.4.0',
    extspam: 'Gp8ICJkIEpkICggwMDAwMDAwMRAGGoAI1GiJSIpeO1RZTq9QBKsRbPJdi84ropi16EYI10WB6g74sGmRwSNXjPQnYUKYotKkvLGpshucCaeWZMOylnc6o2AgDX9grhQQx7fm2DJRTyuNhUlwmEoWhjoG3F0ySAWUsEbH3bJMsEBwoB//0qmFJob74ffdaslqL+IrSy7LJ76/G5TkvNC+J0VQkpH1u3iJJs0uUYyLDzdBIQ6Ogd8LDQ3VKnJLm4g/uDLe+G7zzzkOPzCjXL+70naaQ9medzqmh+/SmaQ6uFWLDQLcRln++wBwoEibNpG4uOJvqXy+ql50DjlNchSuqLmeadFoo9/mDT0q3G7o/80P15ostktjb7h9bfNc+nZVSnUEJXbCjTeqS5UYuxn+HTS5nZsPVxJA2O5GdKCYK4x8lTTKShRstqPfbQpplfllx2fwXcSljuYi3YipPyS3GCAqf5A7aYYwJ7AvGqUiR2SsVQ9Nbp8MGHET1GxhifC692APj6SJxZD3i1drSYZPMMsS9rKAJTGz2FEupohtpf2tgXm6c16nDk/cw+C7K7me5j5PLHv55DFCS84b06AytZPdkFZLj7FHOkcFGJXitHkX5cgww7vuf6F3p0yM/W73SoXTx6GX4G6Hg2rYx3O/9VU2Uq8lvURB4qIbD9XQpzmyiFMaytMnqxcZJcoXCtfkTJ6pI7a92JpRUvdSitg967VUDUAQnCXCM/m0snRkR9LtoXAO1FUGpwlp1EfIdCZFPKNnXMeqev0j9W9ZrkEs9ZWcUEexSj5z+dKYQBhIICviYUQHVqBTZSNy22PlUIeDeIs11j7q4t8rD8LPvzAKWVqXE+5lS1JPZkjg4y5hfX1Dod3t96clFfwsvDP6xBSe1NBcoKbkyGxYK0UvPGtKQEE0Se2zAymYDv41klYE9s+rxp8e94/H8XhrL9oGm8KWb2RmYnAE7ry9gd6e8ZuBRIsISlJAE/e8y8xFmP031S6Lnaet6YXPsFpuFsdQs535IjcFd75hh6DNMBYhSfjv456cvhsb99+fRw/KVZLC3yzNSCbLSyo9d9BI45Plma6V8akURQA/qsaAzU0VyTIqZJkPDTzhuCl92vD2AD/QOhx6iwRSVPAxcRFZcWjgc2wCKh+uCYkTVbNQpB9B90YlNmI3fWTuUOUjwOzQRxJZj11NsimjOJ50qQwTTFj6qQvQ1a/I+MkTx5UO+yNHl718JWcR3AXGmv/aa9rD1eNP8ioTGlOZwPgmr2sor2iBpKTOrB83QgZXP+xRYkb4zVC+LoAXEoIa1+zArywlgREer7DLePukkU6wHTkuSaF+ge5Of1bXuU4i938WJHj0t3D8uQxkJvoFi/EYN/7u2P1zGRLV4dHVUsZMGCCtnO6BBigFMAA=',
    referer: 'https://wx.qq.com/?&lang=zh_CN&target=t',
};

class Session {
    @observable loading = true;
    @observable auth;
    @observable code;
    @observable avatar;
    @observable user;

    syncKey;

    genSyncKey(list) {
        return (self.syncKey = list.map(e => `${e.Key}_${e.Val}`).join('|'));
    }

    @action async getCode() {
        var response = await axios.get('https://login.wx.qq.com/jslogin', {
            params: {
                appid: 'wx782c26e4c19acffb',
                fun: 'new',
                redirect_uri: 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?mod=desktop',
                lang: 'zh_CN'
            },
            headers: headers,
        });
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
                tip: 1,
                r: ~new Date(),
                _: +new Date(),
            },
            headers: headers
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
                    },
                    headers: headers
                });
                let auth = {};

                try {
                    auth = {
                        baseURL: axios.defaults.baseURL,
                        skey: response.data.match(/<skey>(.*?)<\/skey>/)[1],
                        passTicket: response.data.match(/<pass_ticket>(.*?)<\/pass_ticket>/)[1],
                        wxsid: response.data.match(/<wxsid>(.*?)<\/wxsid>/)[1],
                        wxuin: response.data.match(/<wxuin>(.*?)<\/wxuin>/)[1],
                    };
                } catch (ex) {
                    window.alert('Your login may be compromised. For account security, you cannot log in to Web WeChat. You can try mobile WeChat or Windows WeChat.');
                    window.location.reload();
                }

                self.auth = auth;
                await storage.set('auth', auth);
                await self.initUser();
                self.keepalive().catch(ex => self.logout());
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
        self.user.ContactList.map(e => {
            e.HeadImgUrl = `${axios.defaults.baseURL}${e.HeadImgUrl.substr(1)}`;
        });
        await contacts.getContats();
        await chat.loadChats(self.user.ChatSet);

        return self.user;
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
        self.genSyncKey(response.data.SyncCheckKey.List);

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
                    synckey: self.syncKey,
                }
            }).catch(ex => {
                if (axios.isCancel(ex)) {
                    loop();
                } else {
                    self.logout();
                }
            });

            if (!response) {
                // Request has been canceled
                return;
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
                return loop();
            } else {
                self.logout();
            }
        };

        // Load the rencets chats
        response.data.AddMsgList.map(
            async e => {
                await chat.loadChats(e.StatusNotifyUserName);
            }
        );

        self.loading = false;
        self.genSyncKey(response.data.SyncCheckKey.List);

        return loop();
    }

    @action async hasLogin() {
        var auth = await storage.get('auth');

        axios.defaults.baseURL = auth.baseURL;

        self.auth = auth && Object.keys(auth).length ? auth : void 0;

        if (self.auth) {
            await self.initUser().catch(ex => self.logout());
            self.keepalive().catch(ex => self.logout());
        }

        return auth;
    }

    @action async logout() {
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
        window.location.reload();
    }
}

const self = new Session();
export default self;
