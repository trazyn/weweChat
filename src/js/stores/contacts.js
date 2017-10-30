
import { observable, action } from 'mobx';
import { ipcRenderer } from 'electron';
import axios from 'axios';
import pinyin from 'han';

import session from './session';
import chat from './chat';
import storage from 'utils/storage';
import helper from 'utils/helper';
import { normalize } from 'utils/emoji';

class Contacts {
    @observable loading = false;
    @observable showGroup = true;
    @observable memberList = [];
    @observable filtered = {
        query: '',
        result: [],
    };

    @action group(list, showall = false) {
        var mappings = {};
        var sorted = [];

        list.map(e => {
            if (!e) {
                return;
            }

            // If 'showall' is false, just show your friends
            if (showall === false
                && !helper.isContact(e)) {
                return;
            }

            var prefix = ((e.RemarkPYInitial || e.PYInitial || pinyin.letter(e.NickName)).toString()[0] + '').replace('?', '#');
            var group = mappings[prefix];

            if (!group) {
                group = mappings[prefix] = [];
            }
            group.push(e);
        });

        for (let key in mappings) {
            sorted.push({
                prefix: key,
                list: mappings[key],
            });
        }

        sorted.sort((a, b) => a.prefix.charCodeAt() - b.prefix.charCodeAt());
        return sorted;
    }

    @action async getUser(userid) {
        var user = self.memberList.find(e => e.UserName === userid);

        if (user) {
            return user;
        }

        await self.batch([userid]);
        user = await self.getUser(userid);
        return user;
    }

    @action async getContats() {
        self.loading = true;

        var auth = await storage.get('auth');
        var me = session.user.User;
        var response = await axios.get('/cgi-bin/mmwebwx-bin/webwxgetcontact', {
            params: {
                r: +new Date(),
                seq: 0,
                skey: auth.skey
            }
        });

        // Remove all official account and brand account
        self.memberList = response.data.MemberList.filter(e => helper.isContact(e) && !helper.isOfficial(e) && !helper.isBrand(e)).concat(me);
        self.memberList.map(e => {
            e.MemberList = [];
            return self.resolveUser(auth, e);
        });

        self.loading = false;
        self.filtered.result = self.group(self.memberList);

        return (window.list = self.memberList);
    }

    resolveUser(auth, user) {
        if (helper.isOfficial(user)
            && !helper.isFileHelper(user)) {
            // Skip the official account
            return;
        }

        if (helper.isBrand(user)
            && !helper.isFileHelper(user)) {
            // Skip the brand account, eg: JD.COM
            return;
        }

        if (helper.isChatRoomRemoved(user)
            && !helper.isFileHelper(user)) {
            // Chat room has removed
            return;
        }

        if (helper.isChatRoom(user.UserName)) {
            let placeholder = user.MemberList.map(e => e.NickName).join(',');

            if (user.NickName) {
                user.Signature = placeholder;
            } else {
                user.NickName = placeholder;
                user.Signature = placeholder;
            }
        }

        user.NickName = normalize(user.NickName);
        user.RemarkName = normalize(user.RemarkName);
        user.Signature = normalize(user.Signature);

        user.HeadImgUrl = `${axios.defaults.baseURL}${user.HeadImgUrl.substr(1)}`;
        user.MemberList.map(e => {
            e.NickName = normalize(e.NickName);
            e.RemarkName = normalize(e.RemarkName);
            e.HeadImgUrl = `${axios.defaults.baseURL}cgi-bin/mmwebwx-bin/webwxgeticon?username=${e.UserName}&chatroomid=${user.EncryChatRoomId}&skey=${auth.skey}&seq=0`;
        });

        return user;
    }

    // Batch get the contacts
    async batch(list) {
        var auth = await storage.get('auth');
        var response = await axios.post(`/cgi-bin/mmwebwx-bin/webwxbatchgetcontact?type=ex&r=${+new Date()}`, {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            Count: list.length,
            List: list.map(e => ({
                UserName: e,
                ChatRoomId: ''
            })),
        });

        if (response.data.BaseResponse.Ret === 0) {
            var shouldUpdate = false;

            response.data.ContactList.map(e => {
                var index = self.memberList.findIndex(user => user.UserName === e.UserName);
                var user = self.resolveUser(auth, e);

                if (!user) return;

                shouldUpdate = true;

                if (index !== -1) {
                    self.memberList[index] = user;
                } else {
                    // This contact is not in your contact list, eg: Temprary chat room
                    self.memberList.push(user);
                }
            });

            if (shouldUpdate) {
                // Update contact in menu
                ipcRenderer.send('menu-update', {
                    contacts: JSON.stringify(self.memberList.filter(e => helper.isContact(e))),
                    cookies: await helper.getCookie(),
                });
            }
        } else {
            throw new Error(`Failed to get user: ${list}`);
        }

        return response.data.ContactList;
    }

    @action filter(text = '', showall = false) {
        text = pinyin.letter(text.toLocaleLowerCase());
        var list = self.memberList.filter(e => {
            var res = pinyin.letter(e.NickName).toLowerCase().indexOf(text) > -1;

            if (e.RemarkName) {
                res = res || pinyin.letter(e.RemarkName).toLowerCase().indexOf(text) > -1;
            }

            return res;
        });

        if (!self.showGroup) {
            list = list.filter(e => {
                return !(e.ContactFlag === 3 && e.SnsFlag === 0);
            });
        }

        self.filtered = {
            query: text,
            result: list.length ? self.group(list, showall) : [],
        };
    }

    @action toggleGroup(showGroup) {
        self.showGroup = showGroup;
    }

    @action async deleteUser(id) {
        self.memberList = self.memberList.filter(e => e.UserName !== id);

        // Update contact in menu
        ipcRenderer.send('menu-update', {
            contacts: JSON.stringify(self.memberList.filter(e => helper.isContact(e))),
            cookies: await helper.getCookie(),
        });
    }

    @action async updateUser(user) {
        var auth = await storage.get('auth');
        var list = self.memberList;
        var index = list.findIndex(e => e.UserName === user.UserName);
        var chating = chat.user;

        // Fix chat room miss user avatar
        user.EncryChatRoomId = list[index]['EncryChatRoomId'];

        user = self.resolveUser(auth, user);

        // Prevent avatar cache
        user.HeadImgUrl = user.HeadImgUrl.replace(/\?\d{13}$/, '') + `?${+new Date()}`;

        if (index !== -1) {
            if (chating
                && user.UserName === chating.UserName) {
                Object.assign(chating, user);
            }

            list[index] = user;
            self.memberList.replace(list);
        }
    }
}

const self = new Contacts();
export default self;
