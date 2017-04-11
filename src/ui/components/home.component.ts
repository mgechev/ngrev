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
      width: 185px;
      display: block;
      margin: auto;
      cursor: pointer;
      background: #2196F3;
      padding: 13px;
      color: #fff;
      font-size: 18px;
      border: 2px solid #1976D2;
      border-radius: 25px;
      outline: none;
    }

    button:active {
      background: #1976D2;
    }
  `]
})
export class HomeComponent {
  @Output() project = new EventEmitter<string>();

  loadProject() {
    const files = remote.dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
    if (files && files[0]) {
      this.project.emit(files[0]);
    }
  }
}
