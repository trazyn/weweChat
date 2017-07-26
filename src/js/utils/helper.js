
const CHATROOM_NOTIFY_CLOSE = 0;
const CONTACTFLAG_NOTIFYCLOSECONTACT = 512;

const helper = {
    isChatRoom(userid) {
        return userid && userid.startsWith('@@');
    },

    isChatRoomRemoved(user) {
        return helper.isChatRoom(user.UserName) && user.ContactFlag === 0;
    },

    isMuted(user) {
        return helper.isChatRoom(user.UserName) ? user.Statues === CHATROOM_NOTIFY_CLOSE : user.ContactFlag & CONTACTFLAG_NOTIFYCLOSECONTACT;
    },

    isOfficial(user) {
        return !(user.VerifyFlag !== 24 && user.VerifyFlag !== 8 && user.UserName.startsWith('@'));
    },

    parseXml: (text) => {
        var string = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        var matchs = string.match(/(\w+)="([^\s]+)"/g);
        let res = {};

        matchs.map(e => {
            var kv = e.replace(/"/g, '').split('=');

            res[kv[0]] = kv[1];
        });

        return res;
    },

    unique: (arr) => {
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
};

export default helper;
