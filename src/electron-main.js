const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut;
const WindowPosition = require( './electron-window.js' );
const ipcMain = require('electron');
const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
electron.ipcMain.on('request-keysend', (event, arg) => {
    // Displays the object sent from the renderer process:
    //{
    //    message: "Hi",
    //    someData: "Let's go"
    //}
    console.log(
        arg
    );
    //robot.typeString(arg);
});

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ 
        width: 350, 
        height: 500, 
        frame: true, 
        resizable: false, 
        alwaysOnTop: true 
    });
    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL('http://localhost:3000');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    mainWindow.on('hide', () => {});
    mainWindow.on('show', () => {
        mainWindow.focus();
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow();
    // Register a 'CommandOrControl+X' shortcut listener.
    const ret = globalShortcut.register('Control+Alt+Q', () => {
        console.log('Control+Alt+Q is pressed')
        if (mainWindow.isVisible())
            mainWindow.hide();
        else {
            var position = new WindowPosition();
            var pos = position.getActiveScreenCenter(300,300);
            mainWindow.setPosition(pos.x, pos.y);
            mainWindow.show();
        }
    })

    if (!ret) {
        console.log('registration failed')
    }

    const keyEsc = globalShortcut.register('Escape', () => {
        mainWindow.hide(false);
        console.log(mainWindow);
    });
    console.log(globalShortcut.isRegistered('Escape'))
    // Check whether a shortcut is registered.
    console.log(globalShortcut.isRegistered('Control+Alt+Q'))
})

app.on('will-quit', function () {
    electron.globalShortcut.unregister('Escape');
    electron.globalShortcut.unregisterAll();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.