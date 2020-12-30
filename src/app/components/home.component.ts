import { Component, Output, EventEmitter, Input } from "@angular/core";

import { Network } from "vis";
import { Configuration } from "../model/configuration";
import { Config } from "../../shared/data-format";

declare const require: any;
@Component({
  selector: "ngrev-home",
  template: ` <button (click)="loadProject()">Select Project</button> `,
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
    `,
  ],
})
export class HomeComponent {
  @Output()
  project = new EventEmitter<{ config: Config; tsconfig: string }>();

  config: Config;

  constructor(private configProvider: Configuration) {}

  // ngAfterViewInit() {
  //   this.loadProject();
  // }

  loadProject() {
    // const filePaths = ['/Users/mgechev/Projects/angular-devtools/projects/ng-devtools/tsconfig.lib.json'];
    window.require('electron').remote.dialog
      .showOpenDialog({ properties: ["openFile", "multiSelections"] })
      .then(({filePaths}) => {
        let config: Config;
        this.configProvider.getConfig().then((conf: Config) => {
          config = conf;
          this.config = config;

          if (filePaths && filePaths[0]) {
            this.project.emit({ tsconfig: filePaths[0], config: this.config });
          }
        });
      });
  }
}
