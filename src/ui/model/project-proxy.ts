import { IPCBus } from './ipc-bus';
import { Message } from '../../shared/ipc-constants';
import { Injectable } from '@angular/core';

@Injectable()
export class ProjectProxy {
  constructor(private ipcBus: IPCBus) {}

  load(tsconfig: string, showLibs: boolean) {
    return this.ipcBus.send(Message.LoadProject, { tsconfig, showLibs });
  }

  getSymbols() {
    return this.ipcBus.send(Message.GetSymbols);
  }
}
