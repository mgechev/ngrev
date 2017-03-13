import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { ProjectProxy } from '../model/project-proxy';
import { Network } from 'vis';
import { ContextSymbols } from 'ngast';
import { StateProxy } from '../states/state-proxy';
import { VisualizationConfig, Metadata } from '../../shared/data-format';

const SpinnerProps = {
  project: {
    left: '50%',
    top: '50%',
    size: 55
  },
  default: {
    left: 15,
    top: 8,
    size: 35
  }
};

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
      [metadata]="currentMetadata"
      (select)="tryChangeState($event)"
      (highlight)="updateMetadata($event)"
    >
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
  currentMetadata: Metadata;
  currentData: VisualizationConfig<any>;
  loading = false;

  spinner = SpinnerProps.project;

  constructor(
    private ngZone: NgZone,
    private project: ProjectProxy,
    private cd: ChangeDetectorRef,
    public state: StateProxy) {}

  ngAfterViewInit() {
    // this.onProject('/Users/mgechev/Projects/angular-seed/src/client/tsconfig.json');
  }

  tryChangeState(nodeId: string) {
    this.loading = true;
    this.cd.detectChanges();
    this.state.nextState(nodeId)
      .then(() => this.updateNewState())
      .then(() => this.loading = false)
      .catch(() => this.loading = false);
  }

  updateMetadata(nodeId: string) {
    this.loading = true;
    this.cd.detectChanges();
    this.currentMetadata = null;
    this.state.getMetadata(nodeId)
      .then((metadata: Metadata) => this.currentMetadata = metadata)
      .then(() => this.loading = false)
      .catch(() => this.loading = false);
  }

  onProject(tsconfig: string) {
    this.ngZone.run(() => {
      this.loading = true;
      this.project.load(tsconfig)
        .then((rootContext: ContextSymbols) => this.state = new StateProxy())
        .then((proxy: StateProxy) => proxy.getData())
        .then(data => this.currentData = data)
        .then(() => {
          this.spinner = SpinnerProps.project;
          this.loading = false;
        })
        .catch(() => this.loading = false);
    });
  }

  prevState() {
    this.loading = true;
    this.cd.detectChanges();
    this.currentMetadata = null;
    this.state.prevState().then(() => this.updateNewState())
      .then(() => this.loading = false)
      .catch(() => this.loading = false);
  }

  private updateNewState() {
    this.loading = true;
    this.cd.detectChanges();
    this.currentMetadata = null;
    this.state.getData()
      .then(data => this.currentData = data)
      .then(() => this.loading = false)
      .catch(() => this.loading = false);
  }
}
