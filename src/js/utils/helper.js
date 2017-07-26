
export default {
    isChatRoom: (userid) => {
        return userid && userid.startsWith('@@');
    },

    isOfficial: (user) => {
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
