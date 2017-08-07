
import { observable, action } from 'mobx';
import pinyin from 'han';

import contacts from './contacts';
import chat from './chat';
import helper from 'utils/helper';

class Forward {
    @observable show = false;
    @observable message = {};
    @observable list = [];
    @observable query = '';

    @action async toggle(show = self.show, message = {}) {
        self.show = show;
        self.message = message;

        console.log(message);

        if (show === false) {
            self.query = '';
            self.list.replace([]);
        }
    }

    @action search(text = '') {
        var list;

        self.query = text;

        if (text) {
            list = contacts.memberList.filter(e => {
                return pinyin.letter(e.NickName).toLowerCase().indexOf(pinyin.letter(text.toLocaleLowerCase())) > -1;
            });
            self.list.replace(list);

            return;
        }

        self.list.replace([]);
    }

    @action async send(userid) {
        var message = self.message;
        var user = await contacts.getUser(userid);

        switch (message.MsgType) {
            case 1:
                // Text Message
                chat.sendMessage(user, message.Content);
                break;

            case 3:
                chat.sendImage(user, helper.decodeHTML(message.Content), true);
                break;
        }
    }
}

const self = new Forward();
export default self;
