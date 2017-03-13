import { State } from './state';
import { VisualizationConfig, Metadata } from '../formatters/data-format';
import { fork } from 'child_process';
import * as path from 'path';
import { RPCBus } from '../model/rpc-bus';
import { GetData, NextState, GetMetadata, PrevState } from '../model/ipc-constants';

export class StateProxy {
  private rpcBus: RPCBus = new RPCBus();
  private currentMetadata: Metadata;
  private currentData: VisualizationConfig<any>;
  private dataDirty = true;

  getData(): Promise<VisualizationConfig<any>> {
    if (this.dataDirty) {
      return this.rpcBus.send(GetData)
        .then(data => {
          this.dataDirty = false;
          this.currentData = data;
          return data;
        });
    } else {
      return Promise.resolve(this.currentData);
    }
  }

  nextState(id: string): Promise<void> {
    return this.rpcBus.send(NextState, id)
      .then(state => {
        this.dataDirty = true;
        return state;
      });
  }

  getMetadata(id: string): Promise<Metadata> {
    return this.rpcBus.send(GetMetadata, id)
      .then(metadata => {
        this.currentMetadata = metadata;
        return metadata;
      })
  }

  prevState(): Promise<void> {
    return this.rpcBus.send(PrevState)
      .then(state => {
        this.dataDirty = true;
        return state;
      });
  }
}
