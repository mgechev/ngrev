import { app, MenuItem, MenuItemConstructorOptions } from 'electron';

export const devMenuTemplate = (): MenuItem | MenuItemConstructorOptions => {
  return {
    label: 'Development',
    submenu: [
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
