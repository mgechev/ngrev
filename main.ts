import { app, BrowserWindow, screen, Menu } from 'electron';
import { getConfig, setConfigProps } from './src/electron/config';
import { devMenuTemplate } from './src/electron/menu/dev_menu_template';
import { applicationMenuTemplate } from './src/electron/menu/application_menu_template';
import { BackgroundApp } from './src/electron/model/background-app';
import { checkForUpdates } from './auto-update';
import { isDev } from './utils';
import * as path from 'path';
import * as url from 'url';

let win: BrowserWindow = null;

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (isDev) {
  const userDataPath = app.getPath('userData').toString();
  app.setPath('userData', userDataPath + ' (development)');
}

const themeChange = (theme: string) => setConfigProps({ theme });

const libsToggle = () => {
  const config = getConfig();
  const showLibs = !config.showLibs;
  setConfigProps({ showLibs });
};

const modulesOnlyToggle = () => {
  const config = getConfig();
  const showModules = !config.showModules;
  setConfigProps({ showModules });
};

const menuItems = [
  applicationMenuTemplate(
    themeChange,
    libsToggle,
    modulesOnlyToggle
  )
];
if (isDev) {
  menuItems.push(devMenuTemplate());
}

export const menus = Menu.buildFromTemplate(menuItems);

function createWindow(): BrowserWindow {
  Menu.setApplicationMenu(menus);

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (isDev) ? true : false,
      contextIsolation: false,  // false if you want to run 2e2 test with Spectron
      enableRemoteModule : true // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
    },
  });

  win.setTitle(require('./package.json').name);

  if (isDev) {

    win.webContents.openDevTools();

    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');

  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.on('show', checkForUpdates);

  const backgroundApp = new BackgroundApp();
  backgroundApp.init(getConfig());

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
