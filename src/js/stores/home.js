
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

async function resolveMessage(message) {
    var auth = await storage.get('auth');

    switch (message.MsgType) {
        case 3:
            let string = message.Content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            let matchs = string.match(/(\w+)="([^\s]+)"/g);
            let images = {};

            matchs.map(e => {
                var kv = e.replace(/"/g, '').split('=');

                images[kv[0]] = kv[1];
            });

            images.src = `${axios.defaults.baseURL}/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&MsgID=${message.MsgId}&skey=${auth.skey}`.replace(/\/+/g, '/');
            message.images = images;
            break;

        // TODO: Voice, Location etc
    }

    return message;
}

class Home {
    @observable chats = [];
    @observable messages = {};
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
            self.messages[e.UserName] = [];
        });

        return res;
    }

    @action chatTo(user) {
        self.user = user;
        self.markedRead(user.UserName);
    }

    @action async addMessage(message) {
        var from = message.FromUserName;
        var messages = Object.assign({}, self.messages);
        var list = messages[from].slice();

        // Check new message has already in the chat set
        if (Array.isArray(list)) {
            // Swap the chatset order
            let index = self.chats.findIndex(e => e.UserName === from);
            let chats = [];

            if (index > 0) {
                chats = [
                    self.chats.slice(index, index + 1),
                    ...self.chats.slice(0, index),
                    ...self.chats.slice(index + 1, self.chats.length)
                ];

                self.chats.replace(chats);
            }

            // Drop the duplicate message
            if (!list.find(e => e.NewMsgId === message.NewMsgId)) {
                list.push(await resolveMessage(message));
            }
        } else {
            let user = self.users[from];

            if (user) {
                self.chats.shift(user);
                list = messages[from] = [message];
            }
        }

        if (list.length) {
            if (self.user.UserName === from) {
                // Current chat to user
                list.unread = list.length;
            }

            messages[from] = list;
        }

        // Force refresh the messages list
        self.messages = messages;
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
            let messages = Object.assign({}, self.messages);

            messages[to].push({
                isme: true,
                Content: content,
                MsgType: 1,
                CreateTime: +new Date() / 1000,
                HeadImgUrl: `${axios.defaults.baseURL}${session.user.User.HeadImgUrl}`.replace(/\/+/g, '/')
            });

            self.markedRead(to);
        } else {
            console.error('Failed to send message: %o', response.data);
        }

        return +response.data.BaseResponse.Ret === 0;
    }

    @action markedRead(userid) {
        var messages = Object.assign({}, self.messages);
        var list = messages[userid];

        if (list) {
            list.unread = list.length;
            self.messages = messages;
        } else {
            // Init the message queue
            self.messages[userid] = [];
        }
    }
}

const self = new Home();
export default self;
