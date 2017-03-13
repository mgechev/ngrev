import { Component, Output, EventEmitter } from '@angular/core';

import { Network } from 'vis';
import { remote } from 'electron';

@Component({
  selector: 'ngrev-home',
  template: `
    <button (click)="loadProject()">Select Project</button>
  `,
  styles: [`
    :host {
      width: 100%;
      display: flex;
      height: 100%;
      flex-direction: column;
      justify-content: center;
    }

    button {
      height: 32px;
      width: 160px;
      display: block;
      margin: auto;
      cursor: pointer;
    }
  `]
})
export class HomeComponent {
  @Output() project = new EventEmitter<string>();

  loadProject() {
    const files = remote.dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] });
    if (files && files[0]) {
      this.project.emit(files[0]);
    }
  }
}
