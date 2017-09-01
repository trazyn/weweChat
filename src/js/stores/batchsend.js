
import { observable, action } from 'mobx';
import pinyin from 'han';

import contacts from './contacts';

class BatchSend {
    @observable show = false;
    @observable query = '';
    @observable filtered = [];

    @action async toggle(show = !self.show) {
        self.show = show;

        if (show === false) {
            self.query = '';
            self.filtered.replace([]);
        }
    }

    @action search(text = '') {
        var list = contacts.memberList;

        self.query = text;

        if (text) {
            text = pinyin.letter(text.toLocaleLowerCase());

            list = list.filter(e => {
                var res = pinyin.letter(e.NickName).toLowerCase().indexOf(text) > -1;

                if (e.RemarkName) {
                    res = res || pinyin.letter(e.RemarkName).toLowerCase().indexOf(text) > -1;
                }

                return res;
            });
            self.filtered.replace(list);

            return;
        }

        self.filtered.replace([]);
    }
}

const self = new BatchSend();
export default self;
