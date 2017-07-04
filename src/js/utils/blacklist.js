
export default function blacklist(src, ...args) {
    var copy = {};
    var ignore = Array.from(args);

    for (var key in src) {
        if (ignore.indexOf(key) === -1) {
            copy[key] = src[key];
        }
    }

    return copy;
}
