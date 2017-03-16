import { app, BrowserWindow } from 'electron';

export const devMenuTemplate = () => {
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
  ]};
};