
import fs from 'fs';
import { app, BrowserWindow, Tray, Menu, ipcMain, shell } from 'electron';
import windowStateKeeper from 'electron-window-state';
import notifier from 'node-notifier';

import pkg from './package.json';

let forceQuit = false;
let mainWindow;
let tray;
let settings;
let userData = app.getPath('userData');
let imagesCacheDir = `${userData}/images`;
let voicesCacheDir = `${userData}/voices`;

[imagesCacheDir, voicesCacheDir].map(e => {
    if (!fs.existsSync(e)) {
        fs.mkdirSync(e);
    }
});

function updateTray(unread = 0) {
    if (settings.showOnTray) {
        if (tray) {
            if (updateTray.lastUnread === unread) {
                return;
            } else {
                tray.destroy();
            }
        }

        let contextmenu = Menu.buildFromTemplate([
            {
                label: `You have ${unread} messages`,
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-messages');
                }
            },
            {
                label: 'Toggle main window',
                click() {
                    let isVisible = mainWindow.isVisible();
                    isVisible ? mainWindow.hide() : mainWindow.show();
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Settings',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-settings');
                }
            },
            {
                label: 'Fork me on Github',
                click() {
                    shell.openExternal('https://github.com/trazyn/weweChat');
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Toggle DevTools',
                accelerator: 'Alt+Command+I',
                click() {
                    mainWindow.show();
                    mainWindow.toggleDevTools();
                }
            },
            {
                label: 'Hide menu bar icon',
                click() {
                    mainWindow.webContents.send('hide-tray');
                }
            },
            {
                label: 'Quit weweChat',
                accelerator: 'Command+Q',
                selector: 'terminate:',
                click() {
                    forceQuit = true;
                    mainWindow = null;
                    app.quit();
                }
            }
        ]);

        // Make sure the last tray has been destroyed
        setTimeout(() => {
            tray && tray.destroy();

            tray = new Tray(
                unread
                    ? `${__dirname}/src/assets/images/icon-new-message.png`
                    : `${__dirname}/src/assets/images/icon.png`
            );
            tray.on('right-click', () => {
                tray.popUpContextMenu();
            });
            tray.setContextMenu(contextmenu);
        });
    } else {
        if (tray) {
            tray.destroy();
            tray = null;
        }
    }

    // Avoid tray icon been recreate
    updateTray.lastUnread = unread;
}

function createMenu() {
    var menu = Menu.buildFromTemplate([
        {
            label: pkg.name,
            submenu: [
                {
                    label: `About ${pkg.name}`,
                    click() {
                        shell.openExternal('https://github.com/trazyn/weweChat');
                    }
                },
                {
                    type: 'separator'
                },
                {
                    role: 'hide'
                },
                {
                    role: 'hideothers'
                },
                {
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit weweChat',
                    accelerator: 'Command+Q',
                    selector: 'terminate:',
                    click() {
                        forceQuit = true;
                        mainWindow = null;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    role: 'undo'
                },
                {
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'cut'
                },
                {
                    role: 'copy'
                },
                {
                    role: 'paste'
                },
                {
                    role: 'pasteandmatchstyle'
                },
                {
                    role: 'delete'
                },
                {
                    role: 'selectall'
                }
            ]
        },
        {
            role: 'window',
            submenu: [
                {
                    role: 'minimize'
                },
                {
                    role: 'close'
                }
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click() {
                        shell.openExternal('https://github.com/trazyn/weweChat/issues');
                    }
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(menu);
}

const createMainWindow = () => {
    var mainWindowState = windowStateKeeper({
        defaultWidth: 1024,
        defaultHeight: 600
    });

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        minWidth: 745,
        minHeight: 450,
        vibrancy: 'medium-light',
        transparent: true,
        titleBarStyle: 'hidden-inset',
        backgroundColor: 'none',
        resizable: false,
        webPreferences: {
            scrollBounce: true
        }
    });

    mainWindow.setSize(350, 460);
    mainWindow.loadURL(`file://${__dirname}/src/index.html`);

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });

    mainWindow.on('close', e => {
        if (forceQuit) {
            mainWindow = null;
            app.quit();
        } else {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    ipcMain.once('logined', event => {
        mainWindow.setResizable(true);
        mainWindow.setSize(mainWindowState.width, mainWindowState.height);
        mainWindowState.manage(mainWindow);
    });

    ipcMain.on('apply-settings', (event, args) => {
        settings = args.settings;
        mainWindow.setAlwaysOnTop(!!settings.alwaysOnTop);

        updateTray();
    });

    ipcMain.on('unread-message', (event, args) => {
        var counter = args.counter;

        if (settings.showOnTray) {
            updateTray(counter);
        }
    });

    ipcMain.on('receive-message', (event, data) => {
        var { icon, title, message } = data;
        var filename = `${imagesCacheDir}/notifier-icon.png`;

        if (settings.showNotification) {
            fs.writeFileSync(filename, icon.replace(/^data:image\/png;base64,/, ''), 'base64');

            notifier.notify({
                title,
                sound: 'Blow',
                contentImage: filename,
                message,
            });
        }
    });

    ipcMain.on('open-image', async(event, dataset, data) => {
        var filename = `${imagesCacheDir}/img_${dataset.id}`;

        fs.writeFileSync(filename, data.replace(/^data:image\/png;base64,/, ''), 'base64');
        shell.openItem(filename);
    });

    ipcMain.on('file-download', async(event, args) => {
        var filename = args.filename;

        fs.writeFileSync(filename, args.raw.replace(/^data:image\/png;base64,/, ''), {
            encoding: 'base64',
            // Overwrite file
            flag: 'wx',
        });
        event.returnValue = filename;
    });

    ipcMain.on('open-file', async(event, filename) => {
        shell.openItem(filename);
    });

    ipcMain.on('open-folder', async(event, dir) => {
        shell.openItem(dir);
    });

    ipcMain.on('open-map', (event, map) => {
        event.preventDefault();
        shell.openExternal(map);
    });

    createMenu();
};

app.setName(pkg.name);
app.dock.setIcon(`${__dirname}/src/assets/images/dock.png`);

app.on('ready', createMainWindow);
app.on('activate', e => {
    if (!mainWindow.isVisible()) {
        mainWindow.show();
    }
});
