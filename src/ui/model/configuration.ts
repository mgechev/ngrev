import { IPCBus } from '../model/ipc-bus';
import { Message } from '../../shared/ipc-constants';
import { Injectable } from '@angular/core';
import { Config } from '../../shared/data-format';
import { MaterialTheme } from '../../shared/themes/material';
import { BuiltInThemesMap, DefaultTheme } from '../../shared/themes/color-map';

@Injectable()
export class Configuration {
  constructor(private ipcBus: IPCBus) {}

  getConfig(): Promise<Config> {
    return this.ipcBus.send(Message.Config).then(config => {
      config.themes = Object.assign(config.themes || {}, BuiltInThemesMap);
      config.theme = config.theme || DefaultTheme;
      return config;
    });
  }
}
