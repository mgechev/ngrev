import { IPCBus } from './ipc-bus';
import { LoadProject, GetSymbols } from '../../shared/ipc-constants';
import { Injectable } from '@angular/core';

@Injectable()
export class ProjectProxy {
  constructor(private ipcBus: IPCBus) {}

  load(tsconfig: string) {
    return this.ipcBus.send(LoadProject, tsconfig);
  }

  getSymbols() {
    return this.ipcBus.send(GetSymbols)
  }
}
