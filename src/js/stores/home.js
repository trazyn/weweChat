
import { observable, action } from 'mobx';

import contacts from './contacts';

function unique(arr) {
    var mappings = {};
    var res = [];

    arr.map(e => {
        mappings[e] = true;
    });

    for (var key in mappings) {
        if (mappings[key] === true) {
            res.push(key);
        }
    }

    return res;
}

class Home {
    @observable chats = [];
    @observable user;

    users;

    async getUsers() {
        if (self.users) {
            return self.users;
        }

        self.user = await contacts.getList();

        return self.user;
    }

    @action async loadChats(chatSet) {
        var list = await self.getUsers();
        var res = [];

        unique(chatSet.split(',')).map(e => {
            var user = list.find(user => user.UserName === e);

            if (user) {
                res.push(user);
            }
        });

        self.chats.replace(res);
        return res;
    }

    @action chatTo(user) {
        self.user = user;
    }
}

const self = new Home();
export default self;
