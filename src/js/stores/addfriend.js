
import { observable, action } from 'mobx';
import axios from 'axios';

import storage from 'utils/storage';

class AddFriend {
    @observable show = false;
    user;

    @action toggle(show = self.show, user = self.user) {
        self.show = show;
        self.user = user;
    }

    @action async sendRequest(message) {
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
                Value: self.user.UserName,
                VerifyUserTicket: '',
            }],
            VerifyUserListSize: 1,
            skey: auth.skey,
        });

        return +response.data.BaseResponse.Ret === 0;
    }
}

const self = new AddFriend();
export default self;
