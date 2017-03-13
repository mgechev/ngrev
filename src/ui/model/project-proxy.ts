import { IPCBus } from './ipc-bus';
import { LoadProject } from '../../shared/ipc-constants';

export class ProjectProxy {
  private ipcBus: IPCBus = new IPCBus();

  load(tsconfig: string) {
    return this.ipcBus.send(LoadProject, tsconfig);
  }
}
