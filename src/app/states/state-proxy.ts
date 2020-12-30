import { IPCBus } from '../model/ipc-bus';
import { Message } from '../../shared/ipc-constants';
import { Metadata, VisualizationConfig } from '../../shared/data-format';
import { Injectable } from '@angular/core';

export class StateProxy {
  private ipcBus: IPCBus = new IPCBus();
  private currentData: VisualizationConfig<any>;
  private dataDirty = true;
  private _active: boolean;

  get active() {
    return this._active;
  }

  getData(): Promise<VisualizationConfig<any>> {
    this._active = true;
    if (this.dataDirty) {
      return this.ipcBus.send(Message.GetData).then(data => {
        this.dataDirty = false;
        this.currentData = data;
        return data;
      });
    } else {
      return Promise.resolve(this.currentData);
    }
  }

  reload() {
    this.dataDirty = true;
    return this.getData();
  }

  nextState(id: string): Promise<void> {
    return this.ipcBus.send(Message.NextState, id).then(state => {
      this.dataDirty = true;
      return state;
    });
  }

  getMetadata(id: string): Promise<Metadata> {
    return this.ipcBus.send(Message.GetMetadata, id);
  }

  prevState(): Promise<void> {
    return this.ipcBus.send(Message.PrevState).then(state => {
      this.dataDirty = true;
      return state;
    });
  }

  directStateTransfer(id: string): Promise<void> {
    return this.ipcBus.send(Message.DirectStateTransition, id).then(state => {
      this.dataDirty = true;
      return state;
    });
  }
}
