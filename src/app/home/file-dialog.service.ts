import { Injectable } from '@angular/core';
import { OpenDialogOptions } from 'electron';

@Injectable({
  providedIn: 'root',
})
export class FileDialogService {
  open(options: OpenDialogOptions): Promise<{ filePaths: string[] }> {
    if (process.env.RUNNING_IN_SPECTRON) {
      const filePaths: string[] = [window.require('electron').clipboard.readText()];
      return Promise.resolve({ filePaths });
    }
    return window.require('electron').remote.dialog.showOpenDialog(options);
  }
}
