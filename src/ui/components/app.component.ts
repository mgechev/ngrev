import { Component, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
import { remote } from 'electron';
import { ProjectProxy } from '../model/project-proxy';
import { Network } from 'vis';
import { ProjectSymbols, Symbol } from 'ngast';
import { StateProxy } from '../states/state-proxy';
import { VisualizationConfig, Metadata, SymbolTypes } from '../../shared/data-format';
import { KeyValuePair, QuickAccessComponent } from './quick-access/quick-access.component';
import { StaticSymbol } from '@angular/compiler';
import { SymbolWithId, isMetaNodeId, formatError } from '../shared/utils';
import { StateManager, Memento } from '../model/state-manager';

const BackspaceKeyCode = 8;
const spinner = {
  left: 15,
  top: 8,
  size: 35
};

@Component({
  selector: 'ngrev-app',
  template: `
    <button [class.hidden]="loading" (click)="prevState()" *ngIf="manager.ready">Back</button>
    <ngrev-state-navigation
      [maxWidth]="maxStateNavigationWidth"
      [states]="manager.getHistory()"
      (select)="restoreMemento($event)"
    >
    </ngrev-state-navigation>
    <ngrev-spinner [class.hidden]="!loading"
      [left]="spinner.left"
      [top]="spinner.top"
      [size]="spinner.size"
      *ngIf="manager.ready">
    </ngrev-spinner>
    <ngrev-home *ngIf="!manager.ready" (project)="onProject($event)"></ngrev-home>
    <ngrev-visualizer
      *ngIf="manager.ready"
      [data]="manager.getCurrentState()"
      [metadataResolver]="resolveMetadata"
      (select)="tryChangeState($event)">
    </ngrev-visualizer>
    <ngrev-quick-access
      *ngIf="manager.ready"
      (select)="selectSymbol($event)"
      [queryList]="queryList"
      [queryObject]="queryObject"
    >
    </ngrev-quick-access>
  `,
  host: {
    '(document:keydown)': 'onKeyDown($event)',
    '(window:resize)': 'onWindowResize($event)'
  },
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
  loading = false;
  spinner = spinner;
  queryList: KeyValuePair<SymbolWithId>[] = [];
  queryObject = ['value.name', 'value.filePath'];
  maxStateNavigationWidth = window.innerWidth;

  @ViewChild(QuickAccessComponent) quickAccess: QuickAccessComponent;

  resolveMetadata = (nodeId: string) => {
    this.loading = true;
    return this.manager.getMetadata(nodeId)
      .then(metadata => {
        this.loading = false;
        return metadata;
      }).catch(() => this.loading = false);
  };

  private _currentData: VisualizationConfig<any>;
  private _stopLoading = () => {
    this.loading = false;
    this.cd.detectChanges();
  };
  private _startLoading = () => {
    this.loading = true;
    this.cd.detectChanges();
  };

  constructor(
    private ngZone: NgZone,
    private project: ProjectProxy,
    private manager: StateManager,
    private cd: ChangeDetectorRef) {}

  ngAfterViewInit() {
    // this.onProject('/Users/mgechev/Projects/angular-seed/src/client/tsconfig.json');
    // this.onProject('/Users/mgechev/Projects/ngrev/tsconfig.json');
  }

  onWindowResize(e: any) {
    this.maxStateNavigationWidth = e.target.innerWidth;
  }

  onProject(tsconfig: string) {
    this._startLoading()
    this.manager.loadProject(tsconfig)
      .then(() => this.project.getSymbols())
      .then((symbols) => this.queryList = symbols.map(s => ({ key: s.name, value: s })))
      .then(this._stopLoading)
      .then(() => this.cd.detectChanges())
      .catch(error => {
        remote.dialog.showErrorBox('Error while parsing project', 'Cannot parse your project. Make sure it\'s ' +
        'compatible with the Angular\'s AoT compiler. Error during parsing:\n\n' + formatError(error));
        this._stopLoading();
      });
  }

  onKeyDown(e) {
    if (e.keyCode === BackspaceKeyCode && this.quickAccess && !this.quickAccess.visible()) {
      this.prevState();
    }
  }

  tryChangeState(id: string) {
    this._startLoading();
    this.manager.tryChangeState(id)
      .then(this._stopLoading)
      .catch(this._stopLoading);
  }

  selectSymbol(symbolPair: KeyValuePair<SymbolWithId>) {
    if (symbolPair && symbolPair.value) {
      this.tryChangeState(symbolPair.value.id);
    }
  }

  restoreMemento(memento: Memento) {
    this._startLoading();
    this.manager.restoreMemento(memento)
      .then(this._stopLoading)
      .catch(this._stopLoading);
  }

  private prevState() {
    const mementos = this.manager.getHistory();
    if (mementos.length > 1) {
      this._startLoading();
      this.manager.restoreMemento(mementos[mementos.length - 2])
        .then(this._stopLoading)
        .catch(this._stopLoading);
    }
  }
}
