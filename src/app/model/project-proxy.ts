import { IPCBus } from './ipc-bus';
import { Message } from '../../shared/ipc-constants';
import { Injectable } from '@angular/core';
import { IdentifiedStaticSymbol } from '../../shared/data-format';

@Injectable({
  providedIn: 'root'
})
export class ProjectProxy {
  constructor(private ipcBus: IPCBus) {}

  load(tsconfig: string, showLibs: boolean, showModules: boolean) {
    return this.ipcBus.send(Message.LoadProject, { tsconfig, showLibs, showModules });
  }

  getSymbols(): Promise<IdentifiedStaticSymbol[]> {
    return this.ipcBus.send(Message.GetSymbols);
  }
}
