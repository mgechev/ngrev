import { Message } from "../../../shared/ipc-constants";
import { IPCBus } from "../../model/ipc-bus";
import { Injectable } from "@angular/core";
declare const require: any;
const sanitizeFilename = require("sanitize-filename");

interface SaveDialogType {
  canceled: boolean;
  filePath?: string;
  bookmark?: string;
}

const arrayBufferToBuffer = (ab: ArrayBuffer): Buffer => {
  const buffer = new window.Buffer(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.length; ++i) {
    buffer[i] = view[i];
  }
  return buffer;
}

const blobCallback = (title: string): (b: any) => void => {
  return (b: any) => {
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      const data = {
        name: sanitizeFilename(
          title.toLowerCase().replace(/\s/g, "-")
        ),
        image: fileReader.result as ArrayBuffer,
        format: 'png',
      };
      window.require('electron').remote.dialog
        .showSaveDialog(window.require('electron').remote.BrowserWindow.getAllWindows()[0], {
          title: 'Export to Image',
          defaultPath: sanitizeFilename(data.name + "." + data.format),
        })
        .then((result: SaveDialogType) => {
          const fs = window.require('fs');
          if (data.image && result.filePath) {
            fs.writeFileSync(result.filePath, arrayBufferToBuffer(data.image));
          }
        });
    };
    fileReader.readAsArrayBuffer(b);
  }
}

export interface VisualizerState {
  canvas: HTMLCanvasElement;
  title: string;
}

@Injectable()
export class ExportToImage {
  private ipcCallback?: () => void;
  private visState?: VisualizerState;

  constructor(private ipcBus: IPCBus) {}

  enable(state: VisualizerState) {
    this.disable();
    this.visState = state;
    this.init();
    this.ipcBus.send(Message.EnableExport).catch();
  }

  disable() {
    this.ipcCallback && this.ipcCallback();
    this.ipcBus.send(Message.DisableExport).catch();
  }

  private init() {
    this.ipcCallback = this.ipcBus.on(Message.SaveImage, () => {
      this.visState?.canvas.toBlob(blobCallback(this.visState.title), 'image/png');
    });
  }
}
