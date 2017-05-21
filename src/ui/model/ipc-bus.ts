import { ipcRenderer } from 'electron';
import { Success } from '../../shared/ipc-constants';

export class IPCBus {
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

  on(event: string, cb: any): Function {
    ipcRenderer.addListener(event, cb);
    return () => ipcRenderer.removeListener(event, cb);
  }
}
