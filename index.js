
import { app, BrowserWindow } from 'electron';
import windowStateKeeper from 'electron-window-state';

let mainWindow;

const createMainWindow = () => {
    var mainWindowState = windowStateKeeper({
        defaultWidth: 1024,
        defaultHeight: 720
    });

    mainWindow = new BrowserWindow({
        width: mainWindowState.width,
        hieght: mainWindowState.height,
        x: mainWindowState.x,
        y: mainWindowState.y,
        webPreferences: {
            scrollBounce: true
        }
    });

    mainWindowState.manage(mainWindow);

    mainWindow.loadURL(`file://${__dirname}/src/index.html`);

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        app.quit();
    });
};

app.on('ready', createMainWindow);
