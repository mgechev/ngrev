import { ipcRenderer } from 'electron';
import { Success } from './ipc-constants';

export class RPCBus {
  send(method: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      ipcRenderer.once(method, (e, code, payload) => {
        console.log('Got response of type', method);
        if (code === Success) {
          resolve(payload);
        } else {
          reject(payload);
        }
      });
      ipcRenderer.send(method, data);
    });
  }
}