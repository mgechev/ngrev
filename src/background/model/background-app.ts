import { ipcMain } from 'electron';
import { LoadProject, PrevState, GetMetadata, GetData, NextState, Success, Failure } from '../../shared/ipc-constants';
import { Project } from './project';
import { State } from '../states/state';
import { ModuleTreeState } from '../states/module-tree.state';

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
      this.project.load(tsconfig);
      const rootContext = this.project.rootContext;
      const allModules = rootContext.getModules();
      const rootSymbol = rootContext.getContextSummary().type.reference;
      const module = 
        allModules
          .filter(m => m.symbol.name === rootSymbol.name &&
            m.symbol.filePath === rootSymbol.filePath
          ).pop();
      this.states.push(new ModuleTreeState(rootContext, module));
      console.log('Project loaded');
      success(e.sender, LoadProject, true);
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