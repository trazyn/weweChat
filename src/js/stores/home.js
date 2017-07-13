
import { observable, action } from 'mobx';
import axios from 'axios';

import storage from 'utils/storage';
import contacts from './contacts';
import session from './session';

function unique(arr) {
    var mappings = {};
    var res = [];

    arr.map(e => {
        mappings[e] = true;
    });

    for (var key in mappings) {
        if (mappings[key] === true) {
            res.push(key);
        }
    }

    return res;
}

function parseXml(text) {
    var string = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    var matchs = string.match(/(\w+)="([^\s]+)"/g);
    let res = {};

    matchs.map(e => {
        var kv = e.replace(/"/g, '').split('=');

        res[kv[0]] = kv[1];
    });

    return res;
}

async function resolveMessage(message) {
    var auth = await storage.get('auth');

    switch (message.MsgType) {
        case 3:
            // Image
            let images = parseXml(message.Content);
            images.src = `${axios.defaults.baseURL}/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&msgid=${message.MsgId}&skey=${auth.skey}`.replace(/\/+/g, '/');
            message.images = images;
            break;

        case 34:
            // Voice
            let voice = parseXml(message.Content);
            voice.src = `${axios.defaults.baseURL}/cgi-bin/mmwebwx-bin/webwxgetvoice?&msgid=${message.MsgId}&skey=${auth.skey}`.replace(/\/+/g, '/');
            message.voice = voice;
            break;

        case 47:
            // External emoji
            if (!message.Content) break;

            let emoji = parseXml(message.Content);
            message.emoji = emoji;
            break;

            // TODO: Voice, Location etc
    }

    return message;
}

class Home {
    @observable chats = [];
    @observable messages = new Map();
    @observable user = false;

    users;

    async getUsers() {
        if (self.users) {
            return self.users;
        }

        self.users = await contacts.getList();

        return self.users;
    }

    @action async loadChats(chatSet) {
        var list = await self.getUsers();
        var res = [];

        unique(chatSet.split(',')).map(e => {
            var user = list.find(user => user.UserName === e);

            if (user) {
                res.push(user);
            }
        });

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
        var list = self.messages.get(from);

        // Check new message is already in the chat set
        if (list) {
            // Swap the chatset order
            let index = self.chats.findIndex(e => e.UserName === from);
            let chats = [];

            if (index > 0) {
                chats = [
                    ...self.chats.slice(index, index + 1),
                    ...self.chats.slice(0, index),
                    ...self.chats.slice(index + 1, self.chats.length)
                ];

                self.chats.replace(chats);
            }

            // Drop the duplicate message
            if (!list.data.find(e => e.NewMsgId === message.NewMsgId)) {
                list.data.push(await resolveMessage(message));
            }
        } else {
            let user = self.users[from];

            if (user) {
                self.chats.shift(user);
                list = {
                    data: [message],
                    unread: 0,
                };
            }
        }

        if (self.user.UserName === from) {
            // Current chat to user
            list.unread = list.data.length;
        }

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
                HeadImgUrl: `${axios.defaults.baseURL}${session.user.User.HeadImgUrl}`.replace(/\/+/g, '/')
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
}

const self = new Home();
export default self;
