import { Component, ChangeDetectorRef, NgZone, ViewChild, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
import { ProjectProxy } from './model/project-proxy';
import { Config, Metadata } from '../shared/data-format';
import { SymbolWithId, formatError } from './shared/utils';
import { StateManager, Memento } from './model/state-manager';
import { Theme } from '../shared/themes/color-map';
import { IPCBus } from './model/ipc-bus';
import { Message } from '../shared/ipc-constants';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { debounceTime, filter, map, startWith, tap } from 'rxjs/operators';
import { Configuration } from './model/configuration';
import { ProjectLoadEvent } from './home';
import { BACKSPACE } from '@angular/cdk/keycodes';
import { KeyValuePair, QuickAccessComponent } from './components/quick-access';

@Component({
  selector: 'ngrev-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  projectSet = false;
  loading = false;
  queryList: KeyValuePair<SymbolWithId>[] = [];
  queryObject = ['value.name', 'value.filePath'];
  theme: Theme;
  themes: { [name: string]: Theme };
  showLibs: boolean;
  showModules: boolean;

  maxWidth$: Observable<number>;

  @ViewChild(QuickAccessComponent) quickAccess: QuickAccessComponent;

  private _stopLoading = () => {
    this.loading = false;
  };
  private _startLoading = () => {
    this.loading = true;
  };

  private _keyDownSubscription: Subscription;

  constructor(
    public manager: StateManager,
    private _ngZone: NgZone,
    private _project: ProjectProxy,
    private _changeDetectorRef: ChangeDetectorRef,
    private _ipcBus: IPCBus,
    private _configuration: Configuration
  ) {
    this._configuration.getConfig().then((config: Config) => {
      this.themes = config.themes;
      this.theme = config.themes[config.theme];
      this.showLibs = config.showLibs;
      this.showModules = config.showModules;
    });

    this.maxWidth$ = fromEvent(window, 'resize').pipe(
      debounceTime(100),
      map(() => window.innerWidth),
      startWith(window.innerWidth)
    );

    this._keyDownSubscription = fromEvent(document, 'keydown').pipe(
      filter((event: KeyboardEvent) => event.keyCode === BACKSPACE && this.quickAccess?.hidden),
      tap({
        next: () => {
          this.prevState()
        }
      })
    ).subscribe();
  }

  ngAfterViewInit() {
    this._ipcBus.on(Message.ChangeTheme, (_: any, theme: string) => {
      this.theme = this.themes[theme];
    });
    this._ipcBus.on(Message.ToggleLibsMenuAction, (_: any) => {
      this.manager.toggleLibs().then(() => {
        this.manager.reloadAppState();
      });
    });
    this._ipcBus.on(Message.ToggleModulesMenuAction, (_: any) => {
      this.manager.toggleModules().then(() => {
        this.manager.reloadAppState();
      });
    });
  }

  ngOnDestroy(): void {
    this._keyDownSubscription.unsubscribe();
  }

  onProject({ tsconfig }: ProjectLoadEvent) {
    this.projectSet = true;
    this._startLoading();
    this.manager
      .loadProject(tsconfig, this.showLibs, this.showModules)
      .then(() => this._project.getSymbols())
      .then(symbols => {
        return this.queryList = symbols.map(s => ({ key: s.name, value: s }));
      })
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
  }

  tryChangeState(id: string) {
    this._ngZone.run(() => {
      this._startLoading();
      this.manager
        .tryChangeState(id)
        .then(() => {
          this._stopLoading();
        })
        .catch(() => {
          this._stopLoading();
        });
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

  prevState() {
    const mementos = this.manager.getHistory();
    if (mementos.length > 1) {
      this.restoreMemento(mementos[mementos.length - 2]);
    }
  }
}