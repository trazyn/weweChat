
export function on(el, events, fn) {
    (el && events && fn)
        && events.split().forEach(e => el.addEventListener(e, fn, false));
}

export function off(el, events, fn) {
    (el && events && fn)
        && events.split().forEach(e => el.removeEventListener(e, fn, false));
}
