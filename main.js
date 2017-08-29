
import fs from 'fs';
import tmp from 'tmp';
import { app, powerMonitor, BrowserWindow, Tray, Menu, ipcMain, clipboard, shell } from 'electron';
import windowStateKeeper from 'electron-window-state';
import AutoLaunch from 'auto-launch';

import pkg from './package.json';

let forceQuit = false;
let mainWindow;
let tray;
let settings;
let isFullScreen = false;
let isWin = process.platform === 'win32';
let isOsx = process.platform === 'darwin';
let userData = app.getPath('userData');
let imagesCacheDir = `${userData}/images`;
let voicesCacheDir = `${userData}/voices`;
let mainMenu = [
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
                label: 'Preferences...',
                accelerator: 'Cmd+,',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-settings');
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
        label: 'File',
        submenu: [
            {
                label: 'New Chat',
                accelerator: 'Cmd+N',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-newchat');
                }
            },
            {
                label: 'Search...',
                accelerator: 'Cmd+F',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-search');
                }
            },
            {
                type: 'separator',
            },
            {
                label: 'Insert emoji',
                accelerator: 'Cmd+I',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-emoji');
                }
            },
            {
                label: 'Insert file',
                accelerator: 'Cmd+O',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-uploader');
                }
            },
            {
                type: 'separator',
            },
            {
                label: 'Next conversation',
                accelerator: 'Cmd+J',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-next');
                }
            },
            {
                label: 'Previous conversation',
                accelerator: 'Cmd+K',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-previous');
                }
            },
        ]
    },
    {
        label: 'Conversations',
        submenu: [
            {
                label: 'Loading...',
            }
        ],
    },
    {
        label: 'Contacts',
        submenu: [
            {
                label: 'Loading...',
            }
        ],
    },
    {

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
        label: 'View',
        submenu: [
            {
                label: isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen',
                accelerator: 'Shift+Cmd+F',
                click() {
                    isFullScreen = !isFullScreen;

                    mainWindow.show();
                    mainWindow.setFullScreen(isFullScreen);
                }
            },
            {
                label: 'Toggle Conversations',
                accelerator: 'Shift+Cmd+M',
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-conversations');
                }
            },
            {
                type: 'separator',
            },
            {
                label: ''
            },
            {
                type: 'separator',
            },
            {
                role: 'toggledevtools'
            },
            {
                role: 'togglefullscreen'
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
                label: 'Feedback',
                click() {
                    shell.openExternal('https://github.com/trazyn/weweChat/issues');
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
                label: '💕 Follow me on Twitter 👏',
                click() {
                    shell.openExternal('https://github.com/trazyn/weweChat/issues');
                }
            }
        ]
    }
];

function updateTray(unread = 0) {
    if (!isOsx) {
        // Always show the tray icon on windows
        settings.showOnTray = true;
    }

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
                label: 'Preferences...',
                accelerator: 'Cmd+,',
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

async function autostart() {
    var launcher = new AutoLaunch({
        name: 'weweChat',
        path: '/Applications/wewechat.app',
    });

    if (settings.startup) {
        if (!isOsx) {
            mainWindow.webContents.send('show-errors', {
                message: 'Currently only supports the OSX.'
            });
            return;
        }

        launcher.enable()
            .catch(ex => {
                console.error(ex);
            });
    } else {
        launcher.disable();
    }
}

function createMenu() {
    var menu = Menu.buildFromTemplate(mainMenu);
    Menu.setApplicationMenu(menu);
}

const createMainWindow = () => {
    var mainWindowState = windowStateKeeper({
        defaultWidth: 745,
        defaultHeight: 500,
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
        },
        frame: !isWin,
    });

    mainWindow.setSize(350, 460);
    mainWindow.loadURL(
        process.env.NODE_ENV === 'production'
            ? `file://${__dirname}/src/index.html`
            : `file://${__dirname}/src/index.dev.html`
    );

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

    ipcMain.on('settings-apply', (event, args) => {
        settings = args.settings;
        mainWindow.setAlwaysOnTop(!!settings.alwaysOnTop);

        try {
            updateTray();
            autostart();
        } catch (ex) {
            console.error(ex);
        }
    });

    ipcMain.on('menu-update', (event, args) => {
        var { contacts, conversations } = args;

        contacts = JSON.parse(contacts);
        conversations = JSON.parse(conversations);

        conversations = conversations.slice(0, 10).map((e, index) => {
            return {
                label: e.NickName,
                accelerator: `Cmd+${index}`,
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('message-chatto', {
                        id: e.UserName,
                    });
                }
            };
        });

        contacts = contacts.map(e => {
            return {
                label: e.NickName,
                click() {
                    mainWindow.show();
                    mainWindow.webContents.send('show-userinfo', {
                        id: e.UserName,
                    });
                }
            };
        });

        mainMenu.find(e => e.label === 'Conversations').submenu = conversations;
        mainMenu.find(e => e.label === 'Contacts').submenu = contacts;

        createMenu();
    });

    ipcMain.on('message-unread', (event, args) => {
        var counter = args.counter;

        if (settings.showOnTray) {
            updateTray(counter);
        }
    });

    ipcMain.on('file-paste', (event) => {
        var image = clipboard.readImage();
        var args = { hasImage: false };

        if (!image.isEmpty()) {
            let filename = tmp.tmpNameSync() + '.png';

            args = {
                hasImage: true,
                filename,
                raw: image.toPNG(),
            };

            fs.writeFileSync(filename, image.toPNG());
        }

        event.returnValue = args;
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

    ipcMain.on('open-map', (event, args) => {
        event.preventDefault();
        shell.openExternal(args.map);
    });

    ipcMain.on('open-image', async(event, args) => {
        var filename = `${imagesCacheDir}/img_${args.dataset.id}`;

        fs.writeFileSync(filename, args.base64.replace(/^data:image\/png;base64,/, ''), 'base64');
        shell.openItem(filename);
    });

    ipcMain.once('logined', event => {
        mainWindow.setResizable(true);
        mainWindow.setSize(mainWindowState.width, mainWindowState.height);
        mainWindowState.manage(mainWindow);
    });

    powerMonitor.on('resume', () => {
        mainWindow.webContents.send('os-resume');
    });

    if (isOsx) {
        createMenu();
    }

    [imagesCacheDir, voicesCacheDir].map(e => {
        if (!fs.existsSync(e)) {
            fs.mkdirSync(e);
        }
    });
};

app.setName(pkg.name);
app.dock && app.dock.setIcon(`${__dirname}/src/assets/images/dock.png`);

app.on('ready', createMainWindow);
app.on('before-quit', () => {
    // Fix issues #14
    forceQuit = true;
});
app.on('activate', e => {
    if (!mainWindow.isVisible()) {
        mainWindow.show();
    }
});
