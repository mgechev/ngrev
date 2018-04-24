import { Component, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
import { remote } from 'electron';
import { ProjectProxy } from '../model/project-proxy';
import { Network } from 'vis';
import { ProjectSymbols, Symbol } from 'ngast';
import { VisualizationConfig, Metadata, SymbolTypes, Config } from '../../shared/data-format';
import { KeyValuePair, QuickAccessComponent } from './quick-access/quick-access.component';
import { StaticSymbol } from '@angular/compiler';
import { SymbolWithId, isMetaNodeId, formatError } from '../shared/utils';
import { StateManager, Memento } from '../model/state-manager';
import { Theme } from '../../shared/themes/color-map';
import { Configuration } from '../model/configuration';

const BackspaceKeyCode = 8;
const spinner = {
  left: 15,
  top: 8,
  size: 35
};

@Component({
  selector: 'ngrev-app',
  template: `
    <button [class.hidden]="loading"
      [style.color]="theme.backButton.font"
      [style.background]="theme.backButton.background"
      [style.border]="theme.backButton.border"
      (click)="prevState()"
      *ngIf="initialized">Back</button>
    <ngrev-state-navigation
      [maxWidth]="maxStateNavigationWidth"
      [states]="manager.getHistory()"
      [theme]="theme"
      (select)="restoreMemento($event)"
    >
    </ngrev-state-navigation>
    <ngrev-spinner [class.hidden]="!loading"
      [left]="spinner.left"
      [top]="spinner.top"
      [size]="spinner.size"
      *ngIf="projectSet">
    </ngrev-spinner>
    <ngrev-home *ngIf="!projectSet" [disabled]="selectionDisabled" (project)="onProject($event)"></ngrev-home>
    <ngrev-visualizer
      *ngIf="initialized"
      [data]="initialized"
      [theme]="theme"
      [metadataResolver]="resolveMetadata"
      (select)="tryChangeState($event)">
    </ngrev-visualizer>
    <ngrev-quick-access
      *ngIf="initialized"
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
      border: none;
      outline: none;
      border-bottom-right-radius: 7px;
      background: #eee;
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
  `
  ]
})
export class AppComponent {
  projectSet: boolean = false;
  loading = false;
  spinner = spinner;
  queryList: KeyValuePair<SymbolWithId>[] = [];
  queryObject = ['value.name', 'value.filePath'];
  maxStateNavigationWidth = window.innerWidth;
  theme: Theme;
  selectionDisabled = true;

  @ViewChild(QuickAccessComponent) quickAccess: QuickAccessComponent;

  resolveMetadata = (nodeId: string) => {
    this.loading = true;
    return this.manager
      .getMetadata(nodeId)
      .then(metadata => {
        this.loading = false;
        return metadata;
      })
      .catch(() => (this.loading = false));
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
    private cd: ChangeDetectorRef,
    private config: Configuration
  ) {}

  ngAfterViewInit() {
    this.config.getConfig().then((config: Config) => {
      this.theme = config.themes[config.theme];
      this.selectionDisabled = false;
      this.onProject('/Users/mgechev/Projects/angular-seed/src/client/tsconfig.json');
    });
    // this.onProject('/Users/mgechev/Projects/angular/aio/src/tsconfig.app.json');
    // this.onProject('/Users/mgechev/Projects/ngrev/tsconfig.json');
  }

  onWindowResize(e: any) {
    this.maxStateNavigationWidth = e.target.innerWidth;
    this.cd.detectChanges();
  }

  onProject(tsconfig: string) {
    this.cd.detach();
    this.projectSet = true;
    this.ngZone.run(() => {
      this._startLoading();
      this.manager
        .loadProject(tsconfig)
        .then(() => this.project.getSymbols())
        .then(symbols => (this.queryList = symbols.map(s => ({ key: s.name, value: s }))))
        .then(this._stopLoading)
        .catch(error => {
          remote.dialog.showErrorBox(
            'Error while parsing project',
            "Cannot parse your project. Make sure it's " +
              "compatible with the Angular's AoT compiler. Error during parsing:\n\n" +
              formatError(error)
          );
          this._stopLoading();
        });
    });
  }

  onKeyDown(e) {
    if (e.keyCode === BackspaceKeyCode && this.quickAccess && !this.quickAccess.visible()) {
      this.prevState();
    }
  }

  tryChangeState(id: string) {
    this.ngZone.run(() => {
      this._startLoading();
      this.manager
        .tryChangeState(id)
        .then(this._stopLoading)
        .catch(this._stopLoading);
    });
  }

  selectSymbol(symbolPair: KeyValuePair<SymbolWithId>) {
    if (symbolPair && symbolPair.value) {
      this.tryChangeState(symbolPair.value.id);
    }
  }

  restoreMemento(memento: Memento) {
    this.manager
      .restoreMemento(memento)
      .then(this._stopLoading)
      .catch(this._stopLoading);
  }

  get initialized() {
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
