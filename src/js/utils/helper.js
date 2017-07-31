
const CHATROOM_NOTIFY_CLOSE = 0;
const CONTACTFLAG_NOTIFYCLOSECONTACT = 512;
const MM_USERATTRVERIFYFALG_BIZ_BRAND = 8;
const CONTACTFLAG_TOPCONTACT = 2048;

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

    isTop(user) {
        return user.ContactFlag & CONTACTFLAG_TOPCONTACT;
    },

    isBrand(user) {
        return user.VerifyFlag & MM_USERATTRVERIFYFALG_BIZ_BRAND;
    },

    parseKV: (text) => {
        var string = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        var matchs = string.match(/(\w+)="([^\s]+)"/g);
        let res = {};

        matchs.map(e => {
            var kv = e.replace(/"/g, '').split('=');

            res[kv[0]] = kv[1];
        });

        return res;
    },

    parseXml: (text, tagName) => {
        var parser = new window.DOMParser();
        var xml = parser.parseFromString(text.replace(/&lt;/g, '<').replace(/&gt;/g, '>'), 'text/xml');
        var value;

        if (tagName) {
            value = xml.getElementsByTagName(tagName)[0].childNodes[0].nodeValue;
        }

        return { xml, value };
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
    },

    getMessageContent: (message) => {
        var isChatRoom = helper.isChatRoom(message.FromUserName);
        var content = message.Content;

        if (isChatRoom) {
            content = message.Content.split(':<br/>')[1];
        }

        switch (message.MsgType) {
            case 1:
                if (message.location) return '[Location]';
                // Text message
                return content;

            case 3:
                // Image
                return '[Image]';

            case 34:
                // Image
                return '[Voice]';

            case 42:
                // Contact Card
                return '[Contact Card]';

            case 43:
                // Video
                return '[Video]';

            case 47:
                // Emoji
                return '[Emoji]';

            case 49:
                // Transfer
                return `Money +${message.transfer.money} 💰💰💰`;
        }
    }
};

export default helper;
