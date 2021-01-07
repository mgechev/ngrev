import { app, MenuItem, MenuItemConstructorOptions } from 'electron';

export const devMenuTemplate = (): MenuItem | MenuItemConstructorOptions => {
  return {
    label: 'Development',
    submenu: [
      {
        label: "Reset",
        role: 'reload'
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
