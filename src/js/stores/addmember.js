
import { observable, action } from 'mobx';
import axios from 'axios';
import pinyin from 'han';

import contacts from './contacts';
import storage from 'utils/storage';
import helper from 'utils/helper';

class AddMember {
    @observable show = false;
    @observable query = '';
    @observable list = [];

    @action toggle(show = !self.show) {
        self.show = show;
    }

    @action search(text) {
        text = pinyin.letter(text.toLocaleLowerCase());

        var list = contacts.memberList.filter(e => {
            var res = pinyin.letter(e.NickName).toLowerCase().indexOf(text) > -1;

            if (e.RemarkName) {
                res = res || pinyin.letter(e.RemarkName).toLowerCase().indexOf(text) > -1;
            }

            return helper.isContact(e) && !helper.isChatRoom(e.UserName) && res;
        });

        self.query = text;
        self.list.replace(list);
    }

    @action reset() {
        self.query = '';
        self.list.replace([]);
    }

    @action async addMember(roomId, userids) {
        var auth = await storage.get('auth');
        var response = await axios.post('/cgi-bin/mmwebwx-bin/webwxupdatechatroom?fun=addmember', {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            ChatRoomName: roomId,
            AddMemberList: userids.join(','),
        });

        return +response.data.BaseResponse.Ret === 0;
    }
}

const self = new AddMember();
export default self;
