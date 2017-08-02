
import { observable, action } from 'mobx';
import axios from 'axios';
import pinyin from 'han';

import contacts from './contacts';
import storage from 'utils/storage';
import helper from 'utils/helper';

class NewChat {
    @observable show = false;
    @observable query = '';
    @observable list = [];

    @action toggle(show = !self.show) {
        self.show = show;
    }

    @action search(text) {
        var list = contacts.memberList.filter(e => {
            var res = (e.PYQuanPin + '').toLowerCase().indexOf(pinyin.letter(text.toLocaleLowerCase())) > -1;

            if (e.RemarkPYQuanPin) {
                res = res || (e.RemarkPYQuanPin + '').toLowerCase().indexOf(pinyin.letter(text.toLocaleLowerCase())) > -1;
            }

            return e.isFriend && res;
        });

        self.query = text;
        self.list.replace(list);
    }

    @action reset() {
        self.query = '';
        self.list.replace([]);
    }

    @action async createChatRoom(userids) {
        userids = userids.filter(e => !helper.isChatRoom(e));

        var auth = await storage.get('auth');
        var response = await axios.post(`/cgi-bin/mmwebwx-bin/webwxcreatechatroom?r=${+new Date()}`, {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            MemberCount: userids.length,
            MemberList: userids.map(e => ({ UserName: e }))
        });

        if (+response.data.BaseResponse.Ret === 0) {
            // Load the new contact infomation
            let user = await contacts.getUser(response.data.ChatRoomName);
            return user;
        }

        return false;
    }
}

const self = new NewChat();
export default self;
