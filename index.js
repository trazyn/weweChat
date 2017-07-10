
import { app, BrowserWindow, ipcMain } from 'electron';
import windowStateKeeper from 'electron-window-state';

let mainWindow;

const createMainWindow = () => {
    var mainWindowState = windowStateKeeper({
        defaultWidth: 1024,
        defaultHeight: 600
    });

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
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

        console.log(url);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        app.quit();
    });

    ipcMain.once('logined', event => {
        mainWindow.setResizable(true);
        mainWindow.setSize(mainWindowState.width, mainWindowState.height);
        mainWindowState.manage(mainWindow);
    });
};

app.on('ready', createMainWindow);
