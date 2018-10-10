// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import { join } from 'path';
import * as url from 'url';
import { app, Menu } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { applicationMenuTemplate } from './menu/application_menu_template';
import createWindow from './helpers/window';
import { readFileSync, readdirSync, writeFileSync } from 'fs';

import { BackgroundApp } from './model/background-app';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';
import { Theme, DefaultTheme } from '../shared/themes/color-map';
import { Config } from '../shared/data-format';

console.log(env);

const builtInThemesMap = readdirSync(__dirname)
  .filter(f => f.endsWith('.theme.json'))
  .map(f => JSON.parse(readFileSync(join(__dirname, f)).toString()))
  .reduce((a, theme) => {
    a[theme.name] = theme;
    return a;
  }, {});

console.log(Object.keys(builtInThemesMap));

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  var userDataPath = app.getPath('userData');
  app.setPath('userData', userDataPath + ' (' + env.name + ')');
}

export function getConfig() {
  const path = app.getPath('userData');
  console.log('Looking for config file in', path);
  let config = null;
  let themes: Theme[] = [];
  try {
    config = JSON.parse(readFileSync(join(path, 'config.json')).toString());
    console.log('Found config file');
  } catch (_) {
    console.log('Config file not found');
    return { theme: DefaultTheme, themes: builtInThemesMap } as Partial<Config>;
  }
  try {
    themes = readdirSync(join(path, 'themes'))
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(readFileSync(join(path, 'themes', f)).toString()));
    console.log('Found themes');
  } catch (_) {
    console.log('Themes not found', _);
    return { theme: (config as any).theme, themes: builtInThemesMap } as Partial<Config>;
  }
  return {
    theme: (config as any).theme,
    themes: Object.assign(
      themes.reduce((a, t) => {
        a[t.name] = t as Theme;
        return a;
      }, {}),
      builtInThemesMap
    )
  } as Partial<Config>;
}

function onThemeChange(theme: string) {
  let config = { theme: 'Light' };
  const path = app.getPath('userData');
  try {
    config = JSON.parse(readFileSync(join(path, 'config.json')).toString());
  } catch (e) {}
  try {
    config.theme = theme;
    writeFileSync(join(path, 'config.json'), JSON.stringify(config, null, 2));
  } catch (e) {
    console.error(e);
  }
}

const backgroundApp = new BackgroundApp();
backgroundApp.init(getConfig());

const menuItems = [applicationMenuTemplate(onThemeChange)];
if (env.name !== 'production') {
  menuItems.push(devMenuTemplate());
}

export const menus = Menu.buildFromTemplate(menuItems);

app.on('ready', function() {
  Menu.setApplicationMenu(menus);

  var mainWindow = createWindow('main', {
    width: 1000,
    height: 600
  });

  mainWindow.setTitle(require('../package.json').name);

  mainWindow.loadURL(
    url.format({
      pathname: join(__dirname, 'app.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  if (env.name === 'development') {
    mainWindow.openDevTools();
  }
});

app.on('window-all-closed', function() {
  app.quit();
});
