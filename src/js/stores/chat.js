
import { observable, action } from 'mobx';
import axios from 'axios';
import { ipcRenderer } from 'electron';

import storage from 'utils/storage';
import helper from 'utils/helper';
import contacts from './contacts';
import session from './session';
import settings from './settings';

async function resolveMessage(message) {
    var auth = await storage.get('auth');
    var isChatRoom = helper.isChatRoom(message.FromUserName);
    var content = isChatRoom ? message.Content.split(':<br/>')[1] : message.Content;

    switch (message.MsgType) {
        case 1:
            // Text message and Location
            if (message.Url && message.OriContent) {
                // This message is a location
                let parts = message.Content.split(':<br/>');
                let location = helper.parseKV(message.OriContent);

                location.image = `${axios.defaults.baseURL}${parts[isChatRoom ? 2 : 1]}`.replace(/\/+/g, '/');
                location.href = message.Url;

                message.location = location;
            };
            break;
        case 3:
            // Image
            let images = helper.parseKV(content);
            images.src = `${axios.defaults.baseURL}cgi-bin/mmwebwx-bin/webwxgetmsgimg?&msgid=${message.MsgId}&skey=${auth.skey}`;
            message.images = images;
            break;

        case 34:
            // Voice
            let voice = helper.parseKV(content);
            voice.src = `${axios.defaults.baseURL}cgi-bin/mmwebwx-bin/webwxgetvoice?&msgid=${message.MsgId}&skey=${auth.skey}`;
            message.voice = voice;
            break;

        case 47:
            // External emoji
            if (!content) break;

            let emoji = helper.parseKV(content);

            emoji.src = emoji.cdnurl || `${axios.defaults.baseURL}cgi-bin/mmwebwx-bin/webwxgetmsgimg?&msgid=${message.MsgId}&skey=${auth.skey}`;
            message.emoji = emoji;
            break;

        case 42:
            // Contact
            let contact = message.RecommendInfo;

            contact.image = `${axios.defaults.baseURL}cgi-bin/mmwebwx-bin/webwxgeticon?seq=0&username=${contact.UserName}&skey=${auth.skey}&msgid=${message.MsgId}`;
            contact.name = contact.NickName;
            contact.address = `${contact.Province || 'UNKNOW'}, ${contact.City || 'UNKNOW'}`;
            contact.isFriend = !!contacts.memberList.find(e => e.UserName === contact.UserName);
            message.contact = contact;
            break;

        case 43:
            // Video
            let video = {
                cover: `${axios.defaults.baseURL}cgi-bin/mmwebwx-bin/webwxgetmsgimg?&MsgId=${message.MsgId}&skey=${auth.skey}&type=slave`,
                src: `${axios.defaults.baseURL}cgi-bin/mmwebwx-bin/webwxgetvideo?msgid=${message.MsgId}&skey=${auth.skey}`,
            };

            message.video = video;
            break;

        case 49:
            switch (message.AppMsgType) {
                case 2000:
                    // Transfer
                    let { value } = helper.parseXml(message.Content, 'des');

                    message.MsgType += 2000;
                    message.transfer = {
                        desc: value,
                        money: +value.match(/[\d.]+元/)[0].slice(0, -1),
                    };
                    break;

                case 17:
                    // Location sharing...
                    message.MsgType += 17;
                    break;

                case 6:
                    // Receive file
                    let file = {
                        name: message.FileName,
                        size: message.FileSize,
                        mediaId: message.MediaId,
                        extension: (message.FileName.match(/\.\w+$/) || [])[0],
                    };

                    file.uid = await helper.getCookie('wxuin');
                    file.ticket = await helper.getCookie('webwx_data_ticket');
                    file.download = `${axios.defaults.baseURL.replace(/^https:\/\//, 'https://file.')}cgi-bin/mmwebwx-bin/webwxgetmedia?sender=${message.FromUserName}&mediaid=${file.mediaId}&filename=${file.name}&fromuser=${file.uid}&pass_ticket=undefined&webwx_data_ticket=${file.ticket}`;

                    message.MsgType += 6;
                    message.file = file;
                    break;

                default:
                    console.error('Unknow app message: %o', message);
                    message.Content = '收到一条暂不支持的消息类型，请在手机上查看。';
                    message.MsgType = 19999;
                    break;
            }
            break;

        case 10000:
            // Chat room has been changed
            await contacts.batch([message.FromUserName]);
            break;

        default:
            // Unhandle message
            message.Content = 'Unknow message type: ' + message.MsgType;
            message.MsgType = 19999;
    }

    return message;
}

class Chat {
    @observable sessions = [];
    @observable messages = new Map();
    @observable user = false;

    @action async loadChats(chatSet) {
        var list = contacts.memberList;
        var res = [];
        var temps = [];
        var sorted = [];

        if (!chatSet) return;

        helper.unique(chatSet.split(',')).map(e => {
            var user = list.find(user => user.UserName === e && !helper.isChatRoom(e));

            if (user) {
                res.push(user);
            } else {
                // User not in your contact
                temps.push(e);
            }
        });

        if (temps.length) {
            await contacts.batch(temps);

            temps.map(e => {
                var user = list.find(user => user.UserName === e);

                // Remove all the invalid accounts, eg: Official account
                if (user) {
                    res.push(user);
                }
            });
        }

        res.map((e, index) => {
            self.messages.set(e.UserName, {
                data: [],
                unread: 0,
            });

            // Save the original index to support sticky feature
            e.index = index;
            e.isTop = helper.isTop(e);

            if (e.isTop) {
                sorted.unshift(e);
            } else {
                sorted.push(e);
            }
        });

        self.sessions.replace(sorted);

        return res;
    }

    @action chatTo(user) {
        var sessions = self.sessions;
        var stickyed = [];
        var normaled = [];
        var index = self.sessions.findIndex(e => e.UserName === user.UserName);

        if (index === -1) {
            // User not in chatset
            sessions = [user, ...self.sessions];
        }

        sessions.map(e => {
            if (e.isTop) {
                stickyed.push(e);
            } else {
                normaled.push(e);
            }
        });

        self.sessions.replace([...stickyed, ...normaled]);
        self.user = user;
        self.markedRead(user.UserName);
    }

    @action async addMessage(message) {
        /* eslint-disable */
        var from = message.FromUserName;
        var user = await contacts.getUser(from);
        var list = self.messages.get(from);
        var sessions = self.sessions;
        var stickyed = [];
        var normaled = [];
        /* eslint-enable */

        // Check new message is already in the chat set
        if (list) {
            // Swap the chatset order
            let index = self.sessions.findIndex(e => e.UserName === from);

            if (index !== -1) {
                sessions = [
                    ...self.sessions.slice(index, index + 1),
                    ...self.sessions.slice(0, index),
                    ...self.sessions.slice(index + 1, self.sessions.length)
                ];
            } else {
                // User not in chatset
                sessions = [user, ...self.sessions];
            }

            // Drop the duplicate message
            if (!list.data.find(e => e.NewMsgId === message.NewMsgId)) {
                message = await resolveMessage(message);

                if (settings.showNotification && !helper.isMuted(user)) {
                    // Get the user avatar and use it as notifier icon
                    let response = await axios.get(user.HeadImgUrl, { responseType: 'arraybuffer' });
                    let base64 = new window.Buffer(response.data, 'binary').toString('base64');

                    ipcRenderer.send('receive-message', {
                        icon: base64,
                        title: user.RemarkName || user.NickName,
                        message: helper.getMessageContent(message),
                    });
                }
                list.data.push(message);
            }
        } else {
            // New friend has accepted
            sessions = [user, ...self.sessions];
            list = {
                data: [message],
                unread: 0,
            };
        }

        if (self.user.UserName === from) {
            // Message has readed
            list.unread = list.data.length;
        }

        sessions = sessions.map(e => {
            // Catch the contact update, eg: MsgType = 10000, chat room name has changed
            var user = contacts.memberList.find(user => user.UserName === e.UserName);
            user.isTop = e.isTop;

            // Fix sticky bug
            if (user.isTop) {
                stickyed.push(user);
            } else {
                normaled.push(user);
            }
        });

        self.sessions.replace([...stickyed, ...normaled]);
        self.messages.set(from, list);
    }

    @action async sendMessage(user, content) {
        var id = (+new Date() * 1000) + Math.random().toString().substr(2, 4);
        var auth = await storage.get('auth');
        var from = session.user.User.UserName;
        var to = user.UserName;
        var response = await axios.post(`/cgi-bin/mmwebwx-bin/webwxsendmsg`, {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            Msg: {
                Content: content,
                FromUserName: from,
                ToUserName: to,
                ClientMsgId: id,
                LocalID: id,
                Type: 1,
            },
            Scene: 0,
        });

        if (+response.data.BaseResponse.Ret === 0) {
            // Sent success
            let list = self.messages.get(to);

            list.data.push({
                isme: true,
                Content: content,
                MsgType: 1,
                CreateTime: +new Date() / 1000,
                HeadImgUrl: session.user.User.HeadImgUrl,
            });

            if (!helper.isChatRoom(user.UserName)
                && !user.isFriend) {
                // The target is not your friend
                list.data.push({
                    Content: `${user.sex ? 'She' : 'He'} is not your friend, <a class="addFriend" data-userid="${user.UserName}">Send friend request</a>`,
                    MsgType: 19999,
                });
            }

            self.markedRead(to);
            self.messages.set(to, list);
        } else {
            console.error('Failed to send message: %o', response.data);
        }

        return +response.data.BaseResponse.Ret === 0;
    }

    @action markedRead(userid) {
        var list = self.messages.get(userid);

        if (list) {
            list.unread = list.data.length;
        } else {
            list = {
                data: [],
                unread: 0,
            };
        }

        self.messages.set(userid, list);
    }

    @action async sticky(user) {
        var auth = await storage.get('auth');
        var sticky = +!user.isTop;
        var response = await axios.post('/cgi-bin/mmwebwx-bin/webwxoplog', {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            CmdId: 3,
            OP: sticky,
            RemarkName: '',
            UserName: user.UserName
        });
        var sorted = [];

        if (+response.data.BaseResponse.Ret === 0) {
            self.sessions.find(e => e.UserName === user.UserName).isTop = !user.isTop;
            self.sessions.sort((a, b) => a.index - b.index).map(e => {
                if (e.isTop) {
                    sorted.unshift(e);
                } else {
                    sorted.push(e);
                }
            });
            self.sessions.replace(sorted);

            return true;
        }

        return false;
    }

    @action removeChat(user) {
        var sessions = self.sessions.filter(e => e.UserName !== user.UserName);
        self.sessions.replace(sessions);
    }

    @action empty(user) {
        // Empty the chat content
        self.messages.set(user.UserName, {
            data: [],
            unread: 0,
        });
    }
}

const self = new Chat();
export default self;
