
import { observable, action } from 'mobx';
import axios from 'axios';
import pinyin from 'han';

import storage from 'utils/storage';
import helper from 'utils/helper';

class Contacts {
    @observable loading = false;
    @observable showGroup = true;
    @observable filtered = {
        query: '',
        result: [],
    };

    memberList;

    @action group(list) {
        var mappings = {};
        var sorted = [];

        list.map(e => {
            if (!e) {
                return;
            }

            var prefix = ((e.RemarkPYInitial || e.PYInitial).toString()[0] + '').replace('?', '#');
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

    @action async getList() {
        self.loading = true;

        var auth = await storage.get('auth');
        var response = await axios.get('/cgi-bin/mmwebwx-bin/webwxgetcontact', {
            params: {
                r: +new Date(),
                seq: 0,
                skey: auth.skey
            }
        });
        var chatRooms = [];

        // Remove all public account
        self.memberList = response.data.MemberList.filter(e => e.VerifyFlag !== 24 && e.VerifyFlag !== 8 && e.UserName.startsWith('@'));
        self.memberList.map(e => {
            e.HeadImgUrl = `${axios.defaults.baseURL}${e.HeadImgUrl.substr(1)}`;

            if (helper.isChatRoom(e.UserName)) {
                // This is a chat room contact
                chatRooms.push(e.UserName);
            }
        });

        if (chatRooms.length) {
            await self.getChatRoomMembers(chatRooms);
        }

        self.loading = false;
        self.filtered.result = self.group(self.memberList);

        window.LIST = self.memberList;

        return self.memberList;
    }

    async getChatRoomMembers(chatRooms) {
        var auth = await storage.get('auth');
        var response = await axios.post(`/cgi-bin/mmwebwx-bin/webwxbatchgetcontact?type=ex&r=${+new Date()}`, {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            Count: chatRooms.length,
            List: chatRooms.map(e => ({
                UserName: e,
                ChatRoomId: ''
            })),
        });

        if (response.data.BaseResponse.Ret === 0) {
            response.data.ContactList.map(e => {
                var index = self.memberList.findIndex(user => user.UserName === e.UserName);

                e.HeadImgUrl = `${axios.defaults.baseURL}${e.HeadImgUrl.substr(1)}`;
                e.MemberList.map(e => {
                    e.HeadImgUrl = `${axios.defaults.baseURL}cgi-bin/mmwebwx-bin/webwxgeticon?username=${e.UserName}&skey=${auth.skey}&seq=${~new Date()}`;
                });
                self.memberList[index] = e;
            });
        } else {
            throw new Error('Failed to get chat room member');
        }

        return response.data;
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
    }

    @action toggleGroup(showGroup) {
        self.showGroup = showGroup;
    }

    @action updateUser(user) {
        var result = self.memberList.find(e => e.UserName === user.UserName);

        if (result) {
            Object.assign(result, user);
        }
    }
}

const self = new Contacts();
export default self;
