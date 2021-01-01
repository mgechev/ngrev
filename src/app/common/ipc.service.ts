import { Injectable, NgZone } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { Message } from '../../shared/ipc-constants';

@Injectable({
  providedIn: 'root'
})
export class IpcService {
  constructor(private _ngZone: NgZone) {}

  on<T>(event: Message) {
    const { ipcRenderer } = window.require('electron');

    return new Observable<T>((subscriber: Subscriber<T>) => {
      const listener = (_: any, data: T) => {
        this._ngZone.run(() => {
          subscriber.next(data);
        });
      }

      ipcRenderer.addListener(event, listener);
      return () => {
        ipcRenderer.removeListener(event, listener);
      };
    });
  }
}
