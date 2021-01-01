import { Observable, Subscriber, throwError } from 'rxjs';
import { Message, Status } from '../../shared/ipc-constants';

const NonBlocking = {
  [Message.EnableExport]: true,
  [Message.DisableExport]: true,
};

let blocked: boolean = false;

export function isPending(): boolean {
  return blocked;
}

export function ipcOn<T>(event: Message): Observable<T> {
  const { ipcRenderer } = window.require('electron');

  return new Observable<T>((subscriber: Subscriber<T>) => {
    const listener = (_: any, data: T) => {
      subscriber.next(data);
    }
    ipcRenderer.addListener(event, listener);
    return () => {
      ipcRenderer.removeListener(event, listener);
    };
  });
}

export function ipcSend<T, P>(event: Message, payload?: P): Observable<T> {
  if (isPending() &&  !NonBlocking[event]) {
    console.log("Trying to send request", event);
    return throwError('Pending requests');
  }

  const { ipcRenderer } = window.require('electron');
  blocked = true;
  return new Observable<T>((subscriber: Subscriber<T>) => {
    ipcRenderer.once(event, (e: Message, code: Status, data: T) => {
      console.log("Got response of type", event);
      if (code === Status.Success) {
        subscriber.next(data);
      } else {
        subscriber.error(data);
      }
      subscriber.complete();
      blocked = false;
    });

    ipcRenderer.send(event, payload);
  });
}
