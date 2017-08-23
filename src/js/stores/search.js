
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

            return (e.isFriend || helper.isChatRoom(e.UserName)) && res;
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
        var list = [user, ...self.history.filter(e => e.UserName !== user.UserName)];

        await storage.set('history', list);
        await self.getHistory();
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
        var list = await storage.get('history');
        var history = [];

        Array.from(list).map(e => {
            var user = contacts.memberList.find(user => user.UserName === e.UserName);

            if (user) {
                history.push(user);
            }
        });

        await storage.set('history', history);
        self.history.replace(history);

        return history;
    }

    @action toggle(searching = !self.searching) {
        self.searching = searching;
    }
}

const self = new Search();
export default self;
