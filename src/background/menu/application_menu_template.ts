import { app, BrowserWindow } from 'electron';

export var applicationMenuTemplate = () => {
  return {
    label: 'Application',
    submenu: [
      {
        label: 'Reset',
        accelerator: 'CmdOrCtrl+R',
        click: function () {
          BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
        }
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click() {
          app.quit();
        }
      }
    ]
  };
};
