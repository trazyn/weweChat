
import { observable, action } from 'mobx';
import axios from 'axios';
import { ipcRenderer } from 'electron';

import storage from 'utils/storage';
import helper from 'utils/helper';
import getMessageContent from 'utils/getMessageContent';
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
                let location = helper.parseXml(message.OriContent);

                location.image = `${axios.defaults.baseURL}${parts[isChatRoom ? 2 : 1]}`.replace(/\/+/g, '/');
                location.href = message.Url;

                message.location = location;
            };
            break;
        case 3:
            // Image
            let images = helper.parseXml(content);
            images.src = `${axios.defaults.baseURL}/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&msgid=${message.MsgId}&skey=${auth.skey}`.replace(/\/+/g, '/');
            message.images = images;
            break;

        case 34:
            // Voice
            let voice = helper.parseXml(content);
            voice.src = `${axios.defaults.baseURL}/cgi-bin/mmwebwx-bin/webwxgetvoice?&msgid=${message.MsgId}&skey=${auth.skey}`.replace(/\/+/g, '/');
            message.voice = voice;
            break;

        case 47:
            // External emoji
            if (!content) break;

            let emoji = helper.parseXml(content);

            emoji.src = emoji.cdnurl || `${axios.defaults.baseURL}/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&msgid=${message.MsgId}&skey=${auth.skey}`.replace(/\/+/g, '/');
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

        case 10000:
            // Chat room has been changed
            await contacts.batch([message.FromUserName]);
            break;

            // TODO: Vodeo, Red Pack etc
    }

    return message;
}

class Home {
    @observable chats = [];
    @observable messages = new Map();
    @observable user = false;

    @action async loadChats(chatSet) {
        var list = contacts.memberList;
        var res = [];
        var temps = [];

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

        self.chats.replace(res);

        res.map(e => {
            self.messages.set(e.UserName, {
                data: [],
                unread: 0,
            });
        });

        return res;
    }

    @action chatTo(user) {
        self.user = user;
        self.markedRead(user.UserName);
    }

    @action async addMessage(message) {
        var from = message.FromUserName;
        var user = await contacts.getUser(from);
        var list = self.messages.get(from);
        var chats = self.chats;

        // Check new message is already in the chat set
        if (list) {
            // Swap the chatset order
            let index = self.chats.findIndex(e => e.UserName === from);

            if (index !== -1) {
                chats = [
                    ...self.chats.slice(index, index + 1),
                    ...self.chats.slice(0, index),
                    ...self.chats.slice(index + 1, self.chats.length)
                ];
            } else {
                // User not in chatset
                chats = [user, ...self.chats];
            }

            // Drop the duplicate message
            if (!list.data.find(e => e.NewMsgId === message.NewMsgId)) {
                if (settings.showNotification && !helper.isMuted(user)) {
                    // Get the user avatar and use it as notifier icon
                    let response = await axios.get(user.HeadImgUrl, { responseType: 'arraybuffer' });
                    let base64 = new window.Buffer(response.data, 'binary').toString('base64');

                    ipcRenderer.send('receive-message', {
                        icon: base64,
                        title: user.RemarkName || user.NickName,
                        message: getMessageContent(message),
                    });
                }
                list.data.push(await resolveMessage(message));
            }
        } else {
            // New friend has accepted
            chats = [user, ...self.chats];
            list = {
                data: [message],
                unread: 0,
            };
        }

        if (self.user.UserName === from) {
            // Current chat to user
            list.unread = list.data.length;
        }

        chats = chats.map(e => {
            // Catch the contact update, eg: MsgType = 10000, chat room name has changed
            var user = contacts.memberList.find(user => user.UserName === e.UserName);
            user.muted = helper.isMuted(user);
            return user;
        });

        self.chats.replace(chats);
        self.messages.set(from, list);
    }

    @action async sendMessage(content) {
        var id = (+new Date() * 1000) + Math.random().toString().substr(2, 4);
        var auth = await storage.get('auth');
        var from = session.user.User.UserName;
        var to = self.user.UserName;
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

    @action async addFriend(userid, message) {
        var auth = await storage.get('auth');
        var response = await axios.post(`/cgi-bin/mmwebwx-bin/webwxverifyuser?r=${+new Date()}`, {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            Opcode: 2,
            SceneList: [33],
            SceneListCount: 1,
            VerifyContent: message,
            VerifyUserList: [{
                Value: userid,
                VerifyUserTicket: '',
            }],
            VerifyUserListSize: 1,
            skey: auth.skey,
        });

        return +response.data.BaseResponse.Ret === 0;
    }
}

const self = new Home();
export default self;
