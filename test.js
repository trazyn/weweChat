
var Notification = require('node-mac-notifier');

new Notification('衣带渐宽人渐悔', {
    body: 'Notification is the primary focus for this module, so listing and activating do work, but isn\'t documented.',
    icon: '/Users/Aloop/Library/Application Support/Electron/images/notifier-icon.png',
    soundName: 'default',
});
