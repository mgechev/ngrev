import { ProjectSymbols, ContextSymbols } from 'ngast';
import { createProgramFromTsConfig } from '../create-program';
import { readFile, readFileSync } from 'fs';
import { RPCBus } from './rpc-bus';
import { LoadProject } from './ipc-constants';

export class ProjectProxy {
  private rpcBus: RPCBus = new RPCBus();

  load(tsconfig: string) {
    return this.rpcBus.send(LoadProject, tsconfig);
  }
}
