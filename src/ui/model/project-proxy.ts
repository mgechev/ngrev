import { ProjectSymbols, ContextSymbols } from 'ngast';
import { createProgramFromTsConfig } from '../create-program';
import { readFile, readFileSync } from 'fs';
import { IPCBus } from './ipc-bus';
import { LoadProject } from './ipc-constants';

export class ProjectProxy {
  private ipcBus: IPCBus = new IPCBus();

  load(tsconfig: string) {
    return this.ipcBus.send(LoadProject, tsconfig);
  }
}
