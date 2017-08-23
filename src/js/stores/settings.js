
import { observable, action } from 'mobx';
import { remote, ipcRenderer } from 'electron';

import storage from 'utils/storage';

class Settings {
    @observable alwaysOnTop = false;
    @observable showOnTray = false;
    @observable showNotification = true;
    @observable startup = false;
    @observable downloads = '';
    @observable plugins = [{
        name: 'Message Backup',
        link: 'https://github.com/trazyn',
        description: 'Curabitur lobortis id lorem id bibendum. Ut id consectetur magna. Quisque volutpat augue enim, pulvinar lobortis nibh lacinia at. Vestibulum nec erat ut mi sollicitudin porttitor id sit amet risus. Nam tempus vel odio vitae aliquam. In imperdiet eros id lacus vestibulum vestibulum. Suspendisse fermentum sem sagittis ante venenatis egestas quis vel justo. Maecenas semper suscipit nunc, sed aliquam sapien convallis eu. Nulla ut turpis in diam dapibus consequat.',
        version: '1.0.1',
        icon: 'https://lh6.ggpht.com/k7Z4J1IIXXJnC2NRnFfJNlkn7kZge4Zx-Yv5uqYf4222tx74wXDzW24OvOxlcpw0KcQ=w300',
        enabled: true,
    }];

    @action setAlwaysOnTop(alwaysOnTop) {
        self.alwaysOnTop = alwaysOnTop;
        self.save();
    }

    @action setShowOnTray(showOnTray) {
        self.showOnTray = showOnTray;
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

    @action async init() {
        var settings = await storage.get('settings');
        var { alwaysOnTop, showOnTray, showNotification, startup, downloads } = self;

        if (settings && Object.keys(settings).length) {
            self.alwaysOnTop = settings.alwaysOnTop;
            self.showOnTray = settings.showOnTray;
            self.showNotification = settings.showNotification;
            self.startup = settings.startup;
            self.downloads = settings.downloads;
        } else {
            await storage.set('settings', {
                alwaysOnTop,
                showOnTray,
                showNotification,
                startup,
                downloads,
            });
        }

        if (!self.downloads) {
            self.downloads = remote.app.getPath('downloads');
        }

        self.save();
        return settings;
    }

    save() {
        var { alwaysOnTop, showOnTray, showNotification, startup, downloads } = self;

        storage.set('settings', {
            alwaysOnTop,
            showOnTray,
            showNotification,
            startup,
            downloads,
        });

        ipcRenderer.send('apply-settings', {
            settings: {
                alwaysOnTop,
                showOnTray,
                showNotification,
                startup,
                downloads,
            }
        });
    }
}

const self = new Settings();
export default self;
