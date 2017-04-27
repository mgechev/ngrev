import { ipcMain } from 'electron';
import { LoadProject, PrevState, GetMetadata, GetData, NextState, Success, Failure, GetSymbols, DirectStateTransition } from '../../shared/ipc-constants';
import { Project } from './project';
import { State } from '../states/state';
import { ModuleTreeState } from '../states/module-tree.state';
import { getModuleMetadata } from '../formatters/model-formatter';
import { getId, getProviderName } from '../../shared/data-format';
import { Symbol, ProjectSymbols } from 'ngast';
import { PipeState } from '../states/pipe.state';
import { ModuleState } from '../states/module.state';
import { DirectiveState } from '../states/directive.state';
import { SymbolIndex, SymbolData } from './symbol-index';
import { StaticSymbol } from '@angular/compiler';

const success = (sender, msg, payload) => {
  sender.send(msg, Success, payload);
}

const error = (sender, msg, payload) => {
  sender.send(msg, Failure, payload);
};

export class BackgroundApp {
  private project: Project;
  private states: State[] = [];

  init() {
    ipcMain.on(LoadProject, (e, tsconfig: string) => {
      this.states = [];
      console.log(`Loading project: "${tsconfig}"`);
      this.project = new Project();
      let parseError = null;
      try {
        this.project.load(tsconfig, e => parseError = e);
        const allModules = this.project.projectSymbols.getModules();
        if (!parseError) {
          const module =
            allModules
              .filter(m => m.getBootstrapComponents().length).pop();
          this.states.push(new ModuleTreeState(this.project.projectSymbols, module));
          console.log('Project loaded');
          success(e.sender, LoadProject, null);
        } else {
          console.log(parseError);
          error(e.sender, LoadProject, parseError.message);
        }
      } catch (exception) {
        console.log(exception);
        let message = exception.message;
        if (parseError) {
          if (parseError instanceof Error) {
            parseError = parseError.message;
          }
          message = parseError;
        }
        error(e.sender, LoadProject, message);
      }
    });

    ipcMain.on(PrevState, e => {
      console.log('Going to previous state');
      if (this.states.length > 1) {
        this.states.pop();
        console.log('Successfully moved to previous state');
        success(e.sender, PrevState, true);
      } else {
        console.log('Unsuccessfully moved to previous state');
        error(e.sender, PrevState, false);
      }
    });

    ipcMain.on(DirectStateTransition, (e, id: string) => {
      console.log('Direct state transition');
      const index = SymbolIndex.getIndex(this.project.projectSymbols);
      const nextState = index.get(id);
      if (nextState) {
        this.states.push(nextState.stateFactory());
        console.log('Found next state');
        success(e.sender, DirectStateTransition, true);
      } else {
        console.log('No next state');
        error(e.sender, DirectStateTransition, false);
      }
    });

    ipcMain.on(GetSymbols, e => {
      console.log('Get symbols');
      let res = [];
      try {
        const map = SymbolIndex.getIndex(this.project.projectSymbols);
        map.forEach((data: SymbolData, id: string) => {
          if (data.symbol instanceof Symbol) {
            res.push(Object.assign({}, data.symbol.symbol, { id }));
          } else {
            const staticSymbol = new StaticSymbol(null, getProviderName(data.symbol.getMetadata()), []);
            res.push(Object.assign({}, staticSymbol, { id }));
          }
        })
      } catch (e) {
        console.error(e);
      }
      success(e.sender, GetSymbols, res);
    });

    ipcMain.on(GetMetadata, (e, id: string) => {
      console.log('Getting metadata');
      success(e.sender, GetMetadata, this.state.getMetadata(id));
    });

    ipcMain.on(GetData, e => {
      console.log('Getting data');
      success(e.sender, GetData, this.state.getData());
    });

    ipcMain.on(NextState, (e, id: string) => {
      console.log('Moving to next state');
      const nextState = this.state.nextState(id);
      if (nextState) {
        this.states.push(nextState);
        console.log('Found next state');
        success(e.sender, NextState, true);
      } else {
        console.log('No next state');
        error(e.sender, NextState, false);
      }
    });
  }

  get state() {
    return this.states[this.states.length - 1];
  }
}
