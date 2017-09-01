
import { observable, action } from 'mobx';
import axios from 'axios';
import pinyin from 'han';

import session from './session';
import chat from './chat';
import storage from 'utils/storage';
import helper from 'utils/helper';

class Contacts {
    @observable loading = false;
    @observable showGroup = true;
    @observable memberList = [];
    @observable filtered = {
        query: '',
        result: [],
    };

    @action group(list) {
        var mappings = {};
        var sorted = [];

        list.map(e => {
            if (!e) {
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
        self.memberList = response.data.MemberList.filter(e => !helper.isOfficial(e) && !helper.isBrand(e)).concat(me);
        self.memberList.map(e => {
            e.HeadImgUrl = `${axios.defaults.baseURL}${e.HeadImgUrl.substr(1)}`;
        });

        self.loading = false;
        self.filtered.result = self.group(self.memberList);

        return (window.list = self.memberList);
    }

    resolveUser(auth, user) {
        if (helper.isOfficial(user)) {
            // Skip the official account
            return;
        }

        if (helper.isBrand(user)) {
            // Skip the brand account, eg: JD.COM
            return;
        }

        if (helper.isChatRoomRemoved(user)) {
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

        user.HeadImgUrl = `${axios.defaults.baseURL}${user.HeadImgUrl.substr(1)}`;
        user.MemberList.map(e => {
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
            response.data.ContactList.map(e => {
                var index = self.memberList.findIndex(user => user.UserName === e.UserName);
                var user = self.resolveUser(auth, e);

                if (!user) return;

                if (index !== -1) {
                    self.memberList[index] = user;
                } else {
                    // This contact is not in your contact list, eg: Temprary chat room
                    self.memberList.push(user);
                }
            });
        } else {
            throw new Error(`Failed to get user: ${list}`);
        }

        return response.data.ContactList;
    }

    @action filter(text = '') {
        var list = self.memberList.filter(e => {
            var res = (e.PYQuanPin + '').toLowerCase().indexOf(pinyin.letter(text.toLocaleLowerCase())) > -1;

            if (e.RemarkPYQuanPin) {
                res = res || (e.RemarkPYQuanPin + '').toLowerCase().indexOf(pinyin.letter(text.toLocaleLowerCase())) > -1;
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
            result: list.length ? self.group(list) : [],
        };

        window.res = self.filtered;
    }

    @action toggleGroup(showGroup) {
        self.showGroup = showGroup;
    }

    @action deleteUser(id) {
        self.memberList = self.memberList.filter(e => e.UserName !== id);
    }

    @action async updateUser(user) {
        var auth = await storage.get('auth');
        var list = self.memberList;
        var index = list.findIndex(e => e.UserName === user.UserName);
        var chating = chat.user;

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
