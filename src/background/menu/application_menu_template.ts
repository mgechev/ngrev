import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { Message } from '../../shared/ipc-constants';

export var applicationMenuTemplate = () => {
  return {
    label: 'ngrev',
    submenu: [
      {
        label: 'Export',
        accelerator: 'CmdOrCtrl+E',
        enabled: false,
        click() {
          const window = BrowserWindow.getAllWindows()[0];
          window.webContents.send(Message.SaveImage);
        }
      },
      {
        label: 'Reset',
        accelerator: 'CmdOrCtrl+R',
        click() {
          dialog.showMessageBox(
            BrowserWindow.getFocusedWindow(),
            {
              type: 'warning',
              buttons: ['OK', 'Cancel'],
              title: 'Are you sure?',
              message: 'Your progress will be lost. Are you sure you want to refresh and select a new project?'
            },
            (response: number) => {
              if (!response) {
                BrowserWindow.getAllWindows().forEach(w => w.webContents.reloadIgnoringCache());
              }
            }
          );
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
