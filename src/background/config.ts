import { Theme, DefaultTheme } from '../shared/themes/color-map';
import { Config } from '../shared/data-format';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';

const builtInThemesMap = readdirSync(__dirname)
  .filter(f => f.endsWith('.theme.json'))
  .map(f => JSON.parse(readFileSync(join(__dirname, f)).toString()))
  .reduce((a, theme) => {
    a[theme.name] = theme;
    return a;
  }, {});

export const getConfig = () => {
  const path = app.getPath('userData');
  console.log('Looking for config file in', path);
  let config = null;
  let themes: Theme[] = [];
  try {
    config = JSON.parse(readFileSync(join(path, 'config.json')).toString());
    console.log('Found config file');
  } catch (_) {
    console.log('Config file not found');
    return { showLibs: false, showModules: false, theme: DefaultTheme, themes: builtInThemesMap } as Partial<Config>;
  }
  try {
    themes = readdirSync(join(path, 'themes'))
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(readFileSync(join(path, 'themes', f)).toString()));
    console.log('Found themes');
  } catch (_) {
    console.log('Themes not found', _);
    return { showLibs: !!(config as any).showLibs, showModules: !!(config as any).showModules, theme: (config as any).theme, themes: builtInThemesMap } as Partial<
      Config
    >;
  }
  return {
    showLibs: !!(config as any).showLibs,
    showModules: !!(config as any).showModules,
    theme: (config as any).theme,
    themes: Object.assign(
      themes.reduce((a, t) => {
        a[t.name] = t as Theme;
        return a;
      }, {}),
      builtInThemesMap
    )
  } as Partial<Config>;
};

export const setConfigProps = (config: Partial<Config>) => {
  const path = app.getPath('userData');
  let storedConfig: Partial<Config> = {};
  try {
    storedConfig = JSON.parse(readFileSync(join(path, 'config.json')).toString());
  } catch (e) {}
  try {
    Object.assign(storedConfig, config);
    writeFileSync(join(path, 'config.json'), JSON.stringify(storedConfig, null, 2));
  } catch (e) {
    console.error(e);
  }
};
