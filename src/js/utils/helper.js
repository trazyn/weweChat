
import { remote } from 'electron';

const CHATROOM_NOTIFY_CLOSE = 0;
const CONTACTFLAG_NOTIFYCLOSECONTACT = 512;
const MM_USERATTRVERIFYFALG_BIZ_BRAND = 8;
const CONTACTFLAG_TOPCONTACT = 2048;

const helper = {
    isChatRoom: (userid) => {
        return userid && userid.startsWith('@@');
    },

    isChatRoomOwner: (user) => {
        return helper.isChatRoom(user.UserName) && user.IsOwner;
    },

    isChatRoomRemoved: (user) => {
        return helper.isChatRoom(user.UserName) && user.ContactFlag === 0;
    },

    isMuted: (user) => {
        return helper.isChatRoom(user.UserName) ? user.Statues === CHATROOM_NOTIFY_CLOSE : user.ContactFlag & CONTACTFLAG_NOTIFYCLOSECONTACT;
    },

    isOfficial: (user) => {
        return !(user.VerifyFlag !== 24 && user.VerifyFlag !== 8 && user.UserName.startsWith('@'));
    },

    isTop: (user) => {
        if (user.isTop !== void 0) {
            return user.isTop;
        }

        return user.ContactFlag & CONTACTFLAG_TOPCONTACT;
    },

    isBrand: (user) => {
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

            case 49 + 17:
                return '🚀 &nbsp; Location sharing, Please check your phone.';

            case 49 + 6:
                return `🚚 &nbsp; ${message.file.name}`;

            case 49 + 2000:
                // Transfer
                return `Money +${message.transfer.money} 💰💰💰`;
        }
    },

    getCookie: async(name) => {
        var value = {
            name,
        };

        return new Promise((resolve, reject) => {
            var session = remote.getCurrentWindow().webContents.session;
            session.cookies.get(value, (err, cookies) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(cookies[0].value);
                }
            });
        });
    },

    humanSize: (size) => {
        var value = (size / 1024).toFixed(1);

        if (size > (1024 << 10)) {
            value = (value / 1024).toFixed(1);
            return `${value} M`;
        } else {
            return `${value} KB`;
        }
    },

    getFiletypeIcon: (extension) => {
        var filename = 'unknow';

        extension = (extension || '').toLowerCase().replace(/^\./, '');

        switch (true) {
            case ['mp3', 'flac', 'aac', 'm4a', 'wma'].includes(extension):
                filename = 'audio';
                break;

            case ['mp4', 'mkv', 'avi', 'flv'].includes(extension):
                filename = 'audio';
                break;

            case ['zip', 'rar', 'tar', 'tar.gz'].includes(extension):
                filename = 'archive';
                break;

            case ['doc', 'docx'].includes(extension):
                filename = 'word';
                break;

            case ['xls', 'xlsx'].includes(extension):
                filename = 'excel';
                break;

            case ['ai', 'apk', 'exe', 'ipa', 'pdf', 'ppt', 'psd'].includes(extension):
                filename = extension;
                break;
        }

        return `${filename}.png`;
    },

    getPallet: (image) => {
        return new Promise((resolve, reject) => {
            new window.AlbumColors(image).getColors((colors, err) => {
                if (err) {
                    resolve([
                        [0, 0, 0],
                        [0, 0, 0],
                        [0, 0, 0],
                    ]);
                } else {
                    resolve(colors);
                }
            });
        });
    }
};

export default helper;
