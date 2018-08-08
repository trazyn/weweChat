
import { observable, action } from 'mobx';
import { remote, ipcRenderer } from 'electron';

import storage from 'utils/storage';
import helper from 'utils/helper';

class Settings {
    @observable alwaysOnTop = false;
    @observable showOnTray = false;
    @observable showNotification = true;
    @observable confirmImagePaste = true;
    @observable startup = false;
    @observable blockRecall = false;
    @observable rememberConversation = false;
    @observable showRedIcon = true;
    @observable downloads = '';
    @observable proxy = '';

    @action setAlwaysOnTop(alwaysOnTop) {
        self.alwaysOnTop = alwaysOnTop;
        self.save();
    }

    @action setShowRedIcon(showRedIcon) {
        self.showRedIcon = showRedIcon;
        self.save();
    }

    @action setRememberConversation(rememberConversation) {
        self.rememberConversation = rememberConversation;
        self.save();
    }

    @action setBlockRecall(blockRecall) {
        self.blockRecall = blockRecall;
        self.save();
    }

    @action setShowOnTray(showOnTray) {
        self.showOnTray = showOnTray;
        self.save();
    }

    @action setConfirmImagePaste(confirmImagePaste) {
        self.confirmImagePaste = confirmImagePaste;
        self.save();
    }

    @action setShowNotification(showNotification) {
        self.showNotification = showNotification;
        self.save();
    }

    @action setStartup(startup) {
        self.startup = startup;
        self.save();
    }

    @action setDownloads(downloads) {
        self.downloads = downloads.path;
        self.save();
    }

    @action setProxy(proxy) {
        if (!/^http(s)?:\/\/\w+/i.test(proxy)) {
            proxy = '';
        }

        self.proxy = proxy;
        self.save();
    }

    @action async init() {
        var settings = await storage.get('settings');
        var { alwaysOnTop, showOnTray, showNotification, blockRecall, rememberConversation, showRedIcon, startup, downloads, proxy } = self;

        if (settings && Object.keys(settings).length) {
            // Use !! force convert to a bool value
            self.alwaysOnTop = !!settings.alwaysOnTop;
            self.showOnTray = !!settings.showOnTray;
            self.showNotification = !!settings.showNotification;
            self.confirmImagePaste = !!settings.confirmImagePaste;
            self.startup = !!settings.startup;
            self.blockRecall = !!settings.blockRecall;
            self.rememberConversation = !!settings.rememberConversation;
            self.showRedIcon = !!settings.showRedIcon;
            self.downloads = settings.downloads;
            self.proxy = settings.proxy;
        } else {
            await storage.set('settings', {
                alwaysOnTop,
                showOnTray,
                showNotification,
                startup,
                downloads,
                blockRecall,
                rememberConversation,
                showRedIcon,
                proxy,
            });
        }

        // Alway show the tray icon on windows
        if (!helper.isOsx) {
            self.showOnTray = true;
        }

        if (!self.downloads
            || typeof self.downloads !== 'string') {
            self.downloads = remote.app.getPath('downloads');
        }

        self.save();
        return settings;
    }

    save() {
        var { alwaysOnTop, showOnTray, showNotification, confirmImagePaste, blockRecall, rememberConversation, showRedIcon, startup, downloads, proxy } = self;

        storage.set('settings', {
            alwaysOnTop,
            showOnTray,
            showNotification,
            confirmImagePaste,
            startup,
            downloads,
            blockRecall,
            rememberConversation,
            showRedIcon,
            proxy,
        });

        ipcRenderer.send('settings-apply', {
            settings: {
                alwaysOnTop,
                showOnTray,
                showNotification,
                confirmImagePaste,
                startup,
                downloads,
                blockRecall,
                rememberConversation,
                showRedIcon,
                proxy,
            }
        });
    }
}

const self = new Settings();
export default self;
