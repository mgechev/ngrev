import { Component, ChangeDetectorRef, NgZone, ViewChild } from '@angular/core';
import { ProjectProxy } from '../model/project-proxy';
import { Config, Metadata } from '../../shared/data-format';
import { KeyValuePair, QuickAccessComponent } from './quick-access/quick-access.component';
import { SymbolWithId, formatError } from '../shared/utils';
import { StateManager, Memento } from '../model/state-manager';
import { Theme } from '../../shared/themes/color-map';
import { IPCBus } from '../model/ipc-bus';
import { Message } from '../../shared/ipc-constants';

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
    <ngrev-home *ngIf="!projectSet" (project)="onProject($event)"></ngrev-home>
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
      [theme]="theme"
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
  projectSet = false;
  loading = false;
  spinner = spinner;
  queryList: KeyValuePair<SymbolWithId>[] = [];
  queryObject = ['value.name', 'value.filePath'];
  maxStateNavigationWidth = window.innerWidth;
  theme: Theme;
  themes: { [name: string]: Theme };
  showLibs: boolean;
  showModules: boolean;

  @ViewChild(QuickAccessComponent)
  quickAccess: QuickAccessComponent;

  resolveMetadata = (nodeId: string): Promise<Metadata | boolean> => {
    this.loading = true;
    return this.manager
      .getMetadata(nodeId)
      .then(metadata => {
        this.loading = false;
        return metadata;
      })
      .catch(() => (this.loading = false));
  };

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
    private ipcBus: IPCBus
  ) {}

  ngAfterViewInit() {
    this.ipcBus.on(Message.ChangeTheme, (_: any, theme: string) => {
      this.theme = this.themes[theme];
      this.cd.detectChanges();
    });
    this.ipcBus.on(Message.ToggleLibsMenuAction, (_: any) => {
      this.manager.toggleLibs().then(() => {
        this.manager.reloadAppState();
        this.cd.detectChanges();
      });
    });
    this.ipcBus.on(Message.ToggleModulesMenuAction, (_: any) => {
      this.manager.toggleModules().then(() => {
        this.manager.reloadAppState();
        this.cd.detectChanges();
      });
    });
  }

  onWindowResize(e: any) {
    this.maxStateNavigationWidth = e.target.innerWidth;
    this.cd.detectChanges();
  }

  onProject({ tsconfig, config }: { tsconfig: string; config: Config }) {
    this.themes = config.themes;
    this.theme = config.themes[config.theme];
    this.showLibs = config.showLibs;
    this.showModules = config.showModules;

    this.cd.detach();

    this.projectSet = true;
    this.ngZone.run(() => {
      this._startLoading();
      this.manager
        .loadProject(tsconfig, this.showLibs, this.showModules)
        .then(() => this.project.getSymbols())
        .then(symbols => (this.queryList = symbols.map(s => ({ key: s.name, value: s }))))
        .then(this._stopLoading)
        .catch(error => {
          window.require('electron').remote.dialog.showErrorBox(
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
    return this.manager.getCurrentState(() => this.cd.detectChanges());
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
