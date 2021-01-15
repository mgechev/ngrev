import { IPCBus } from '../model/ipc-bus';
import { Message } from '../../shared/ipc-constants';
import { Metadata, VisualizationConfig } from '../../shared/data-format';

export class StateProxy {
  private ipcBus: IPCBus = new IPCBus();
  private currentData?: VisualizationConfig<any>;
  private dataDirty = true;
  private _active: boolean = false;

  get active(): boolean {
    return this._active;
  }

  getData(): Promise<VisualizationConfig<any>> {
    this._active = true;
    if (this.dataDirty) {
      return this.ipcBus.send<VisualizationConfig<any>>(Message.GetData).then((data: VisualizationConfig<any>) => {
        this.dataDirty = false;
        this.currentData = data;
        return data;
      });
    } else {
      return this.currentData ? Promise.resolve(this.currentData) : Promise.reject();
    }
  }

  reload(): Promise<VisualizationConfig<any>> {
    this.dataDirty = true;
    return this.getData();
  }

  nextState(id: string): Promise<void> {
    return this.ipcBus.send(Message.NextState, id).then((state: any) => {
      this.dataDirty = true;
      return state;
    });
  }

  getMetadata(id: string): Promise<Metadata> {
    return this.ipcBus.send<Metadata, string>(Message.GetMetadata, id);
  }

  prevState(): Promise<void> {
    return this.ipcBus.send<any>(Message.PrevState).then(state => {
      this.dataDirty = true;
      return state;
    });
  }

  directStateTransfer(id: string): Promise<void> {
    return this.ipcBus.send<any>(Message.DirectStateTransition, id).then(state => {
      this.dataDirty = true;
      return state;
    });
  }
}
