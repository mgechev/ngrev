import { app, BrowserWindow, dialog } from "electron";
import { Message } from "../../shared/ipc-constants";
import { getConfig } from "../config";

export const applicationMenuTemplate = (
  onThemeChange: (name: string) => void,
  onLibraryToggle: () => void,
  onModulesToggle: () => void,
) => {
  return {
    label: "ngrev",
    submenu: [
      {
        label: "Themes",
        submenu: Object.keys(getConfig().themes || []).map((label) => {
          return {
            label,
            click() {
              const window = BrowserWindow.getAllWindows()[0];
              onThemeChange(label);
              window.webContents.send(Message.ChangeTheme, label);
            },
          };
        }),
      },
      {
        label: "Export",
        accelerator: "CmdOrCtrl+E",
        enabled: false,
        click() {
          const window = BrowserWindow.getAllWindows()[0];
          window.webContents.send(Message.SaveImage);
        },
      },
      {
        label: "Show libs",
        accelerator: "CmdOrCtrl+L",
        click() {
          const window = BrowserWindow.getAllWindows()[0];
          onLibraryToggle();
          window.webContents.send(Message.ToggleLibsMenuAction);
        },
      },
      {
        label: "Show modules only",
        accelerator: "CmdOrCtrl+M",
        click() {
          const window = BrowserWindow.getAllWindows()[0];
          onModulesToggle();
          window.webContents.send(Message.ToggleModulesMenuAction);
        },
      },
      {
        label: "Fit view",
        accelerator: "CmdOrCtrl+F",
        click() {
          const window = BrowserWindow.getAllWindows()[0];
          window.webContents.send(Message.FitView);
        },
      },
      {
        label: "Reset",
        accelerator: "CmdOrCtrl+R",
        click() {
          dialog
            .showMessageBox(BrowserWindow.getFocusedWindow(), {
              type: "warning",
              buttons: ["OK", "Cancel"],
              title: "Are you sure?",
              message:
                "Your progress will be lost. Are you sure you want to refresh and select a new project?",
            })
            .then((response) => {
              if (!response) {
                BrowserWindow.getAllWindows().forEach((w) =>
                  w.webContents.reloadIgnoringCache()
                );
              }
            });
        },
      },
      {
        label: "Quit",
        accelerator: "CmdOrCtrl+Q",
        click() {
          app.quit();
        },
      },
    ],
  };
};
