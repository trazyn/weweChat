
import { observable, action } from 'mobx';
import pinyin from 'han';

import contacts from './contacts';
import session from './session';
import chat from './chat';

class Forward {
    @observable show = false;
    @observable message = {};
    @observable list = [];
    @observable query = '';

    @action async toggle(show = self.show, message = {}) {
        self.show = show;
        self.message = message;

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
                if (e.UserName === session.user.User.UserName) {
                    return false;
                }

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

        message = Object.assign(message, {
            content: message.Content,
            type: message.MsgType,
        });

        chat.sendMessage(user, message, true);
    }
}

const self = new Forward();
export default self;
