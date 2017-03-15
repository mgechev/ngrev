import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { ProjectProxy } from '../model/project-proxy';
import { Network } from 'vis';
import { ContextSymbols } from 'ngast';
import { StateProxy } from '../states/state-proxy';
import { VisualizationConfig, Metadata } from '../../shared/data-format';


@Component({
  selector: 'ngrev-app',
  template: `
    <button [class.hidden]="loading" (click)="prevState()" *ngIf="state.active">Back</button>
    <ngrev-spinner [class.hidden]="!loading"
      [left]="spinner.left"
      [top]="spinner.top"
      [size]="spinner.size"
      *ngIf="state.active">
    </ngrev-spinner>
    <ngrev-home *ngIf="!state.active" (project)="onProject($event)"></ngrev-home>
    <ngrev-visualizer
      *ngIf="state.active"
      [data]="currentData"
      [metadataResolver]="resolveMetadata"
      (select)="tryChangeState($event)">
    </ngrev-visualizer>
  `,
  styles: [`
    :host {
      width: 100%;
      height: 100%;
      display: block;
    }
    .hidden {
      opacity: 0;
    }
    button {
      top: 0;
      left: 0;
      position: absolute;
      z-index: 1;
      width: 60px;
      height: 30px;
      background: #eee;
      border: none;
      outline: none;
      border-bottom-right-radius: 7px;
      transition: 0.2s opacity;
    }
    ngrev-spinner {
      transition: 0.2s opacity;
      top: 8px;
      left: 15px;
    }
    button:active {
      background: #ccc;
    }
  `]
})
export class AppComponent {
  currentData: VisualizationConfig<any>;
  loading = false;

  spinner = {
    left: 15,
    top: 8,
    size: 35
  };

  resolveMetadata = (nodeId: string) => {
    this.loading = true;
    return this.state.getMetadata(nodeId)
      .then((metadata: Metadata) => {
        this.loading = false;
        return metadata;
      })
      .catch(() => {
        this.loading = false;
        return null;
      });
  };

  constructor(
    private ngZone: NgZone,
    private project: ProjectProxy,
    private cd: ChangeDetectorRef,
    private state: StateProxy) {}

  ngAfterViewInit() {
    this.onProject('/Users/mgechev/Projects/angular-seed/src/client/tsconfig.json');
  }

  tryChangeState(nodeId: string) {
    this.ngZone.run(() => {
      this.loading = true;
      this.cd.detectChanges();
      this.state.nextState(nodeId)
        .then(() => this.updateNewState())
        .then(() => this.loading = false)
        .catch(() => this.loading = false);
    });
  }

  onProject(tsconfig: string) {
    this.ngZone.run(() => {
      this.loading = true;
      this.project.load(tsconfig)
        .then((rootContext: ContextSymbols) => this.state = new StateProxy())
        .then((proxy: StateProxy) => proxy.getData())
        .then(data => this.currentData = data)
        .then(() => {
          this.loading = false;
        })
        .catch(() => this.loading = false);
    });
  }

  private prevState() {
    this.ngZone.run(() => {
      this.loading = true;
      this.cd.detectChanges();
      this.state.prevState().then(() => this.updateNewState())
        .then(() => this.loading = false)
        .catch(() => this.loading = false);
    });
  }

  private updateNewState() {
    this.ngZone.run(() => {
      this.loading = true;
      this.cd.detectChanges();
      this.state.getData()
        .then(data => this.currentData = data)
        .then(() => this.loading = false)
        .catch(() => this.loading = false);
    });
  }
}
