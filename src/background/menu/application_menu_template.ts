import { app, BrowserWindow, dialog } from 'electron';

export var applicationMenuTemplate = () => {
  return {
    label: 'Application',
    submenu: [
      {
        label: 'Reset',
        accelerator: 'CmdOrCtrl+R',
        click: function () {
          dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'warning',
            buttons: ['OK', 'Cancel'],
            title: 'Are you sure?',
            message: 'Your progress will be lost. Are you sure you want to refresh and select a new project?'
          }, (response: number) => {
            if (!response) {
              BrowserWindow.getAllWindows().forEach(w => w.webContents.reloadIgnoringCache());
            }
          });
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
