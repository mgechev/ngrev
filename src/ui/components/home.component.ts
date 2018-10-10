import { Component, Output, EventEmitter, Input } from '@angular/core';

import { Network } from 'vis';
import { remote } from 'electron';
import { Configuration } from '../model/configuration';
import { Config } from '../../shared/data-format';

@Component({
  selector: 'ngrev-home',
  template: `
    <button (click)="loadProject()">Select Project</button>
  `,
  styles: [
    `
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
        background: #2196f3;
        padding: 13px;
        color: #fff;
        font-size: 18px;
        border: 2px solid #1976d2;
        border-radius: 25px;
        outline: none;
      }

      button:active {
        background: #1976d2;
      }
    `
  ]
})
export class HomeComponent {
  @Output()
  project = new EventEmitter<{ config: Config; tsconfig: string }>();

  config: Config;

  constructor(private configProvider: Configuration) {}

  loadProject() {
    const files = remote.dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
    let config: Config;
    this.configProvider.getConfig().then((conf: Config) => {
      config = conf;
      this.config = config;

      if (files && files[0]) {
        this.project.emit({ tsconfig: files[0], config: this.config });
      }
    });
  }
}
