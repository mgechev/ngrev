import { IPCBus } from '../../model/ipc-bus';
import { SaveImage, DisableExport, EnableExport } from '../../../shared/ipc-constants';
import { remote } from 'electron';
import { writeFileSync } from 'fs';
import { Injectable } from '@angular/core';
const sanitizeFilename = require('sanitize-filename');

function arrayBufferToBuffer(ab) {
  var buffer = new Buffer(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
      buffer[i] = view[i];
  }
  return buffer;
}

export interface VisualizerState {
  canvas: HTMLCanvasElement;
  title: string;
}

@Injectable()
export class ExportToImage {

  private ipcCallback: Function;
  private visState: VisualizerState;

  constructor(private ipcBus: IPCBus) {}

  enable(state: VisualizerState) {
    this.disable();
    this.visState = state;
    this.init();
    this.ipcBus.send(EnableExport);
  }

  disable() {
    if (typeof this.ipcCallback === 'function') {
      this.ipcCallback();
    }
    this.ipcBus.send(DisableExport);
  }

  private init() {
    this.ipcCallback = this.ipcBus.on(SaveImage, () => {
      const self = this;

      function blobCallback(b) {
        var r = new FileReader();
        r.onloadend = () => {
          const data = {
            name: sanitizeFilename(self.visState.title.toLowerCase().replace(/\s/g, '-')),
            image: r.result,
            format: 'png'
          };
          remote.dialog.showSaveDialog(remote.BrowserWindow.getAllWindows()[0], {
            title: 'Export to Image',
            defaultPath: sanitizeFilename(data.name + '.' + data.format)
          }, (name: string) => {
            name && writeFileSync(name, arrayBufferToBuffer(data.image));
          });
        };
        r.readAsArrayBuffer(b);
      }
      this.visState.canvas.toBlob(blobCallback, 'image/png');
    });
  }
}
