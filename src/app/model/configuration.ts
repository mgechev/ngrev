import { IPCBus } from './ipc-bus';
import { Message } from '../../shared/ipc-constants';
import { Injectable } from '@angular/core';
import { Config } from '../../shared/data-format';
import { DefaultTheme } from '../../shared/themes/color-map';

@Injectable({
  providedIn: 'root'
})
export class Configuration {
  constructor(private ipcBus: IPCBus) {}

  getConfig(): Promise<Config> {
    return this.ipcBus.send<Config>(Message.Config).then((config: Config) => {
      config.themes = Object.assign(config.themes || {});
      config.theme = config.theme || DefaultTheme;
      return config;
    });
  }
}
