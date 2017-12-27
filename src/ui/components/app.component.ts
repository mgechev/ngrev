import { Component, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
import { remote } from 'electron';
import { ProjectProxy } from '../model/project-proxy';
import { Network } from 'vis';
import { ProjectSymbols, Symbol } from 'ngast';
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
    <button [class.hidden]="manager.loading" (click)="prevState()" *ngIf="projectSet">Back</button>
    <ngrev-state-navigation
      [maxWidth]="maxStateNavigationWidth"
      [states]="manager.getHistory()"
      (select)="restoreMemento($event)"
    >
    </ngrev-state-navigation>
    <ngrev-spinner
      [left]="spinner.left"
      [top]="spinner.top"
      [size]="spinner.size"
      *ngIf="projectSet || manager.loading">
    </ngrev-spinner>
    <ngrev-home *ngIf="!projectSet" (project)="onProject($event)"></ngrev-home>
    <ngrev-visualizer
      *ngIf="projectSet"
      [data]="manager.getCurrentState()"
      [metadataResolver]="resolveMetadata"
      (select)="tryChangeState($event)">
    </ngrev-visualizer>
    <ngrev-quick-access
      *ngIf="projectSet"
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
  styles: [
    `
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
      top: 100px;
      left: 15px;
    }
    button:active {
      background: #ccc;
    }
  `
  ]
})
export class AppComponent {
  spinner = spinner;
  queryList: KeyValuePair<SymbolWithId>[] = [];
  queryObject = ['value.name', 'value.filePath'];
  maxStateNavigationWidth = window.innerWidth;

  @ViewChild(QuickAccessComponent) quickAccess: QuickAccessComponent;

  resolveMetadata = (nodeId: string) => {
    this.cd.detectChanges();
    return this.manager.getMetadata(nodeId).then(metadata => {
      this.cd.detectChanges();
      return metadata;
    });
  };

  private _currentData: VisualizationConfig<any>;

  constructor(
    private ngZone: NgZone,
    private project: ProjectProxy,
    public manager: StateManager,
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.onProject('/Users/mgechev/Projects/angular-seed/src/client/tsconfig.json');
    // this.onProject('/Users/mgechev/Projects/ngrev/tsconfig.json');
  }

  onWindowResize(e: any) {
    this.maxStateNavigationWidth = e.target.innerWidth;
    this.cd.detectChanges();
  }

  onProject(tsconfig: string) {
    this.ngZone.run(() => {
      this.manager
        .loadProject(tsconfig)
        .then(() => this.project.getSymbols())
        .then(symbols => (this.queryList = symbols.map(s => ({ key: s.name, value: s }))))
        .catch(error => {
          remote.dialog.showErrorBox(
            'Error while parsing project',
            "Cannot parse your project. Make sure it's " +
              "compatible with the Angular's AoT compiler. Error during parsing:\n\n" +
              formatError(error)
          );
        })
        .then(() => {
          this.cd.detectChanges();
        });
    });
  }

  onKeyDown(e) {
    if (e.keyCode === BackspaceKeyCode && this.quickAccess && !this.quickAccess.visible()) {
      this.prevState();
      this.cd.detectChanges();
    }
  }

  tryChangeState(id: string) {
    this.ngZone.run(() => {
      this.cd.detectChanges();
      this.manager.tryChangeState(id).then(
        () => {
          this.cd.detectChanges();
        },
        () => {
          this.cd.detectChanges();
        }
      );
    });
  }

  selectSymbol(symbolPair: KeyValuePair<SymbolWithId>) {
    if (symbolPair && symbolPair.value) {
      this.tryChangeState(symbolPair.value.id);
    }
  }

  restoreMemento(memento: Memento) {
    this.cd.detectChanges();
    this.manager.restoreMemento(memento).then(
      () => {
        this.cd.detectChanges();
      },
      () => {
        this.cd.detectChanges();
      }
    );
  }

  get projectSet() {
    return this.manager.getCurrentState();
  }

  private prevState() {
    this.ngZone.run(() => {
      const mementos = this.manager.getHistory();
      if (mementos.length > 1) {
        this.restoreMemento(mementos[mementos.length - 2]);
      }
    });
  }
}
