import { ipcRenderer } from 'electron';
import { Message, Status } from '../../shared/ipc-constants';

const NonBlocking = {
  [Message.EnableExport]: true,
  [Message.DisableExport]: true
};

export class IPCBus {
  private blocked = false;

  send(method: Message, data?: any): Promise<any> {
    if (this.pending && !NonBlocking[method]) {
      console.log('Trying to send request', method);
      return Promise.reject('Pending requests');
    }
    this.blocked = true;
    console.log('Sending method call', method);
    return new Promise((resolve, reject) => {
      ipcRenderer.once(method, (e, code, payload) => {
        console.log('Got response of type', method);
        if (code === Status.Success) {
          resolve(payload);
        } else {
          reject(payload);
        }
        this.blocked = false;
      });
      ipcRenderer.send(method, data);
    });
  }

  get pending() {
    return this.blocked;
  }

  on(event: string, cb: any): () => void {
    ipcRenderer.addListener(event, cb);
    return () => ipcRenderer.removeListener(event, cb);
  }
}
