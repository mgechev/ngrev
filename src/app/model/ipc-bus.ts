import { Message, Status } from "../../shared/ipc-constants";
import { Injectable } from '@angular/core';

const NonBlocking: Message[] = [Message.EnableExport, Message.DisableExport];

@Injectable({
  providedIn: 'root'
})
export class IPCBus {
  private blocked = false;

  constructor() {}

  send<T, R = any>(method: Message, data?: R): Promise<T> {
    if (this.pending && !NonBlocking.includes(method)) {
      console.log("Trying to send request", method);
      return Promise.reject("Pending requests");
    }
    this.blocked = true;
    console.log("Sending method call", method);
    return new Promise((resolve, reject) => {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.once(method, (e: Message, code: Status, payload: T) => {
        console.log("Got response of type", method);
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
    const { ipcRenderer } = window.require("electron");
    ipcRenderer.addListener(event, cb);
    return () => ipcRenderer.removeListener(event, cb);
  }
}
