import { Theme, DefaultTheme } from '../shared/themes/color-map';
import { Config } from '../shared/data-format';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';

// Handle the case when the theme is not there
const builtInThemesMap = readdirSync(join(__dirname, '..', 'assets'))
  .filter(f => f.endsWith('.theme.json'))
  .map(f => JSON.parse(readFileSync(join(__dirname, '..', 'assets', f)).toString()))
  .reduce((a: Config['themes'], theme: Theme) => {
    a[theme.name] = theme;
    return a;
  }, {});

export const getConfig = (): Config => {
  const path = app.getPath('userData');
  console.log('Looking for config file in', path);
  let config = null;
  let themes: Theme[] = [];
  try {
    config = JSON.parse(readFileSync(join(path, 'config.json')).toString());
    console.log('Found config file');
  } catch (_) {
    console.log('Config file not found');
    return { showLibs: false, showModules: false, theme: DefaultTheme, themes: builtInThemesMap };
  }
  try {
    themes = readdirSync(join(path, 'themes'))
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(readFileSync(join(path, 'themes', f)).toString()));
    console.log('Found themes');
  } catch (_) {
    console.log('Themes not found', _);
    return {
      showLibs: config.showLibs,
      showModules: config.showModules,
      theme: config.theme,
      themes: builtInThemesMap
    };
  }
  return {
    showLibs: config.showLibs,
    showModules: config.showModules,
    theme: config.theme,
    themes: Object.assign(
      themes.reduce((a: Config['themes'], t: Theme) => {
        a[t.name] = t;
        return a;
      }, {}),
      builtInThemesMap
    )
  };
};

export const setConfigProps = (config: Partial<Config>): void => {
  const path = app.getPath('userData');
  let storedConfig: Partial<Config> = {};
  try {
    storedConfig = JSON.parse(readFileSync(join(path, 'config.json')).toString());
  } catch (e) {
    console.error(e);
  }
  try {
    Object.assign(storedConfig, config);
    writeFileSync(join(path, 'config.json'), JSON.stringify(storedConfig, null, 2));
  } catch (e) {
    console.error(e);
  }
};
