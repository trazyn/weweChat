
import { observable, action } from 'mobx';
import axios from 'axios';
import pinyin from 'han';

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
        var response = await axios.get('/cgi-bin/mmwebwx-bin/webwxgetcontact', {
            params: {
                r: +new Date(),
                seq: 0,
                skey: auth.skey
            }
        });

        // Remove all official account
        self.memberList = response.data.MemberList.filter(e => !helper.isOfficial(e) && !helper.isBrand(e));
        self.memberList.map(e => {
            if (helper.isChatRoom(e.UserName) && !e.NickName) {
                e.NickName = e.MemberList.map(e => e.NickName).join(',');
            }
            e.HeadImgUrl = `${axios.defaults.baseURL}${e.HeadImgUrl.substr(1)}`;
            e.isFriend = true;
        });

        self.loading = false;
        self.filtered.result = self.group(self.memberList);

        return (window.list = self.memberList);
    }

    // Batch get the contacts
    async batch(list, isFriend = false) {
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

                if (helper.isOfficial(e)) {
                    // Skip the official account
                    return;
                }

                if (helper.isBrand(e)) {
                    // Skip the brand account, eg: JD.COM
                    return;
                }

                if (helper.isChatRoomRemoved(e)) {
                    // Chat room has removed
                    return;
                }

                if (helper.isChatRoom(e.UserName) && !e.NickName) {
                    e.NickName = e.MemberList.map(e => e.NickName).join(',');
                }

                e.isFriend = isFriend;
                e.HeadImgUrl = `${axios.defaults.baseURL}${e.HeadImgUrl.substr(1)}`;
                e.MemberList.map(user => {
                    user.HeadImgUrl = `${axios.defaults.baseURL}cgi-bin/mmwebwx-bin/webwxgeticon?username=${user.UserName}&chatroomid=${e.EncryChatRoomId}&skey=${auth.skey}&seq=0`;
                });

                if (index !== -1) {
                    self.memberList[index] = e;
                } else {
                    // This contact is not in your contact list, eg: Temprary chat room
                    self.memberList.push(e);
                }
            });
        } else {
            throw new Error('Failed to get chat room member');
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

    @action updateUser(user) {
        var result = self.memberList.find(e => e.UserName === user.UserName);

        if (result) {
            Object.assign(result, user);
        }
    }
}

const self = new Contacts();
export default self;
