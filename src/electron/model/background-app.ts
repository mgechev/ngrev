import {
  DirectStateTransitionResponse, GetDataResponse, GetMetadataResponse, GetSymbolsResponse,
  LoadProjectResponse,
  PrevStateResponse,
  SlaveProcess, ToggleLibsResponse, ToggleModulesResponse
} from '../helpers/process';
import { ipcMain, IpcMainEvent, WebContents } from 'electron';
import { Message, Status } from '../../shared/ipc-constants';
import { Config } from '../../shared/data-format';
import { menus } from '../../../main';
import { join } from 'path';
import { MenuIndex, SubmenuIndex } from '../menu/application_menu_template';

const success = (sender: WebContents, msg: Message, payload: any) => {
  sender.send(msg, Status.Success, payload);
};

const error = (sender: WebContents, msg: Message, payload: any) => {
  sender.send(msg, Status.Failure, payload);
};

interface Task {
  (): Promise<void>;
}

class TaskQueue {
  private queue: Task[] = [];

  push(task: Task) {
    this.queue.unshift(task);
    if (this.queue.length === 1) {
      this.next();
    }
  }

  private next() {
    const task = this.queue.pop();
    if (task) {
      task().then(() => this.next(), () => this.next());
    }
  }
}

export class BackgroundApp {
  private slaveProcess!: SlaveProcess;
  private taskQueue!: TaskQueue;

  init(config: Partial<Config>): void {
    this.slaveProcess = SlaveProcess.create(join(__dirname, '..', 'parser.js'));
    this.taskQueue = new TaskQueue();

    ipcMain.on(Message.Config, (event: IpcMainEvent) => {
      success(event.sender, Message.Config, config);
    });

    ipcMain.on(Message.LoadProject, (event: IpcMainEvent, { tsconfig, showLibs, showModules }: { tsconfig: string; showLibs: boolean; showModules: boolean }) => {
      if (!this.slaveProcess.connected) {
        console.log('The slave process is not ready yet');
        return;
      } else {
        console.log('The slave process is connected');
      }
      console.log('Loading project. Forwarding message to the background process.');
      this.taskQueue.push(() => {
        return this.slaveProcess
          .send<LoadProjectResponse>({
            topic: Message.LoadProject,
            tsconfig,
            showLibs,
            showModules
          })
          .then((data: LoadProjectResponse) => {
            if (data.err) {
              console.log('Got error message while loading the project: ', data.err);
              error(event.sender, Message.LoadProject, data.err);
            } else {
              console.log('The project was successfully loaded');
              success(event.sender, Message.LoadProject, null);
            }
          });
      });
    });

    ipcMain.on(Message.PrevState, (event: IpcMainEvent) => {
      console.log('Requesting previous state');
      this.taskQueue.push(() => {
        return this.slaveProcess
          .send<PrevStateResponse>({
            topic: Message.PrevState
          })
          .then((data: PrevStateResponse) => {
            console.log('Got previous state');
            if (data.available) {
              success(event.sender, Message.PrevState, data.available);
            } else {
              error(event.sender, Message.PrevState, data.available);
            }
          });
      });
    });

    ipcMain.on(Message.DirectStateTransition, (event: IpcMainEvent, id: string) => {
      console.log('Requesting direct state transition');
      this.taskQueue.push(() => {
        return this.slaveProcess
          .send<DirectStateTransitionResponse>({
            topic: Message.DirectStateTransition,
            id
          })
          .then((data: DirectStateTransitionResponse) => {
            console.log('Got response for direct state transition', id, data.available);
            if (data.available) {
              success(event.sender, Message.DirectStateTransition, data.available);
            } else {
              error(event.sender, Message.DirectStateTransition, data.available);
            }
          });
      });
    });

    ipcMain.on(Message.GetSymbols, (event: IpcMainEvent) => {
      console.log('Requesting symbols...');
      this.taskQueue.push(() => {
        return this.slaveProcess
          .send<GetSymbolsResponse>({
            topic: Message.GetSymbols
          })
          .then((data: GetSymbolsResponse) => {
            console.log('Got symbols response');
            if (data.symbols) {
              success(event.sender, Message.GetSymbols, data.symbols);
            }
          });
      });
    });

    ipcMain.on(Message.GetMetadata, (event: IpcMainEvent, id: string) => {
      console.log('Requesting metadata...');
      this.taskQueue.push(() => {
        return this.slaveProcess
          .send<GetMetadataResponse>({
            topic: Message.GetMetadata,
            id
          })
          .then((response: GetMetadataResponse) => {
            console.log('Got metadata from the child process');
            if (response.data) {
              success(event.sender, Message.GetMetadata, response.data);
            } else {
              error(event.sender, Message.GetMetadata, null);
            }
          });
      });
    });

    ipcMain.on(Message.GetData, (event: IpcMainEvent) => {
      console.log('Requesting data');
      this.taskQueue.push(() => {
        return this.slaveProcess
          .send<GetDataResponse>({
            topic: Message.GetData
          })
          .then((response: GetDataResponse) => {
            console.log('Got data response', response.data);
            if (response.data) {
              success(event.sender, Message.GetData, response.data);
            } else {
              error(event.sender, Message.GetData, null);
            }
          });
      });
    });

    ipcMain.on(Message.ToggleLibs, (event: IpcMainEvent) => {
      console.log('Toggle libs!');
      this.taskQueue.push(() => {
        return this.slaveProcess
          .send<ToggleLibsResponse>({
            topic: Message.ToggleLibs
          })
          .then(() => {
            console.log('The slave process toggled the libs');
            success(event.sender, Message.ToggleLibs, true);
          });
      });
    });

    ipcMain.on(Message.ToggleModules, (event: IpcMainEvent) => {
      console.log('Toggle modules!');
      this.taskQueue.push(() => {
        return this.slaveProcess
          .send<ToggleModulesResponse>({
            topic: Message.ToggleModules
          })
          .then(() => {
            console.log('The slave process toggled the modules');
            success(event.sender, Message.ToggleModules, true);
          });
      });
    });

    ipcMain.on(Message.DisableExport, (event: IpcMainEvent) => {
      const exportMenuItem = menus.items[MenuIndex.Ngrev].submenu;
      if (exportMenuItem) {
        exportMenuItem.items[SubmenuIndex.Export].enabled = false;
        success(event.sender, Message.DisableExport, true);
      }
    });

    ipcMain.on(Message.EnableExport, (event: IpcMainEvent) => {
      const exportMenuItem = menus.items[MenuIndex.Ngrev].submenu;
      if (exportMenuItem) {
        menus.items[MenuIndex.Ngrev].submenu!.items[SubmenuIndex.Export].enabled = true;
      }
      success(event.sender, Message.EnableExport, true);
    });
  }
}
