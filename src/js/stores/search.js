
import { observable, action } from 'mobx';
import pinyin from 'han';

import contacts from './contacts';
import storage from 'utils/storage';
import helper from 'utils/helper';

class Search {
    @observable history = [];
    @observable result = {
        query: '',
        friend: [],
        groups: [],
    };
    @observable searching = false;

    @action filter(text = '') {
        var list = contacts.memberList.filter(e => {
            var res = (e.PYQuanPin + '').toLowerCase().indexOf(pinyin.letter(text.toLocaleLowerCase())) > -1;

            if (e.RemarkPYQuanPin) {
                res = res || (e.RemarkPYQuanPin + '').toLowerCase().indexOf(pinyin.letter(text.toLocaleLowerCase())) > -1;
            }

            return e.isFriend && res;
        });
        var groups = [];
        var friend = [];

        list.map(e => {
            if (helper.isChatRoom(e.UserName)) {
                return groups.push(e);
            }

            friend.push(e);
        });

        if (text) {
            self.result = {
                query: text,
                friend,
                groups,
            };
        } else {
            self.result = {
                query: text,
                friend: [],
                groups: [],
            };
        }

        self.searching = true;
        return self.result;
    }

    @action clearHistory() {
        self.history = [];
        storage.remove('history', []);
    }

    @action async addHistory(user) {
        var history = [user.UserName, ...self.history.filter(e => e !== user.UserName)];

        await storage.set('history', history);
        self.history.replace(history);

        return history;
    }

    @action async updateHistory(history) {
        await storage.set('history', history);
        self.history.replace(history);
    }

    @action reset() {
        self.result = {
            query: '',
            friend: [],
            groups: [],
        };
        self.toggle(false);
    }

    @action async getHistory() {
        var history = await storage.get('history');

        self.history.replace(Array.isArray(history) ? history : []);
        return history;
    }

    @action toggle(searching = !self.searching) {
        self.searching = searching;
    }
}

const self = new Search();
export default self;
