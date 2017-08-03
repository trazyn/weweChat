
import { observable, action } from 'mobx';
import axios from 'axios';

import helper from 'utils/helper';
import storage from 'utils/storage';

class UserInfo {
    @observable show = false;
    @observable user = {};
    @observable pallet = [];

    @action async toggle(show = self.show, user = self.user) {
        self.show = show;
        self.user = user;

        if (show) {
            self.pallet = await helper.getPallet(user.HeadImgUrl);
        }
    }

    @action updateUser(user) {
        self.user = user;
    }

    @action async setRemarkName(name, id) {
        var auth = await storage.get('auth');
        var response = await axios.post('/cgi-bin/mmwebwx-bin/webwxoplog', {
            BaseRequest: {
                Sid: auth.wxsid,
                Uin: auth.wxuin,
                Skey: auth.skey,
            },
            CmdId: 2,
            RemarkName: name.trim(),
            UserName: id,
        });

        return response.data;
    }
}

const self = new UserInfo();
export default self;
