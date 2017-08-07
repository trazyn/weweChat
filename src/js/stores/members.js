
import { observable, action } from 'mobx';
import pinyin from 'han';

import helper from 'utils/helper';

class Members {
    @observable show = false;
    @observable user = {
        MemberList: [],
    };
    @observable list = [];
    @observable filtered = [];
    @observable query = '';

    @action async toggle(show = self.show, user = self.user) {
        var list = [];

        self.show = show;
        self.user = user;

        if (show === false) {
            self.query = '';
            self.filtered.replace([]);
            return;
        }

        self.list.replace(user.MemberList);

        Promise.all(
            user.MemberList.map(async e => {
                var pallet = e.pallet;

                if (!pallet) {
                    e.pallet = await helper.getPallet(e.HeadImgUrl);
                }
                list.push(e);
            })
        ).then(() => {
            self.list.replace(list);
        });
    }

    @action search(text = '') {
        var list;

        self.query = text;

        if (text) {
            list = self.list.filter(e => {
                return pinyin.letter(e.NickName).toLowerCase().indexOf(pinyin.letter(text.toLocaleLowerCase())) > -1;
            });
            self.filtered.replace(list);

            return;
        }

        self.filtered.replace([]);
    }
}

const self = new Members();
export default self;
