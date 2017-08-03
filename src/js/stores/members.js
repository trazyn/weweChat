
import { observable, action } from 'mobx';
import axios from 'axios';

import storage from 'utils/storage';
import helper from 'utils/helper';

class Members {
    @observable show = false;
    @observable user = {
        MemberList: [],
    };
    @observable list = [];

    @action async toggle(show = self.show, user = self.user) {
        var list = [];

        self.show = show;
        self.user = user;

        if (show === false) {
            return;
        }

        self.list.replace(user.MemberList.sort((a, b) => a.PYQuanPin - b.PYQuanPin));

        Promise.all(
            user.MemberList.map(async e => {
                var pallet = e.pallet;

                if (!pallet) {
                    e.pallet = await helper.getPallet(e.HeadImgUrl);
                }
                list.push(e);
            })
        ).then(() => {
            self.list.replace(list.sort((a, b) => a.PYQuanPin - b.PYQuanPin));
        });
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

const self = new Members();
export default self;
