import { getProviderName } from './../shared/data-format';
import { ModuleTreeState } from './states/module-tree.state';
import { SymbolIndex, SymbolData } from './model/symbol-index';
import { Status, Message } from './../shared/ipc-constants';
import { State } from './states/state';
import { Project } from './model/project';
import { Symbol } from 'ngast';
import {
  ParentProcess,
  LoadProjectRequest,
  RequestHandler,
  Responder,
  PrevStateRequest,
  DirectStateTransitionRequest,
  GetSymbolsRequest,
  GetMetadataRequest,
  GetDataRequest
} from './helpers/process';
import { StaticSymbol } from '@angular/compiler';

export class BackgroundApp {
  private project: Project;
  private states: State[] = [];
  private parentProcess = new ParentProcess();

  init() {
    this.parentProcess.on(Message.LoadProject, (data: LoadProjectRequest, responder: Responder) => {
      this.states.forEach(s => s.destroy());
      SymbolIndex.clear();

      this.states = [];
      console.log(`Loading project: "${data.tsconfig}"`);
      this.project = new Project();
      let parseError: any = null;
      try {
        this.project.load(data.tsconfig, e => (parseError = e));
        const allModules = this.project.projectSymbols.getModules();
        if (!parseError) {
          const module = allModules
            .filter(m => {
              console.log(m.symbol.name);
              return m.getBootstrapComponents().length;
            })
            .pop();
          if (module) {
            console.log('Project loaded');
            this.states.push(new ModuleTreeState(this.project.projectSymbols, module));
            responder({
              topic: Message.LoadProject,
              err: null
            });
          } else {
            responder({
              topic: Message.LoadProject,
              err: 'Cannot find the root module of your project.'
            });
            return;
          }
        } else {
          console.log(parseError);
          responder({
            topic: Message.LoadProject,
            err: (parseError as Error).message
          });
          return;
        }
      } catch (exception) {
        console.log(exception);
        let message = exception.message;
        if (parseError) {
          if ((parseError as any) instanceof Error) {
            parseError = (parseError as Error).message;
          }
          message = parseError;
        }
        responder({
          topic: Message.LoadProject,
          err: message
        });
      }
    });

    this.parentProcess.on(Message.PrevState, (data: PrevStateRequest, responder: Responder) => {
      console.log('Going to previous state');
      if (this.states.length > 1) {
        this.states.pop();
        console.log('Successfully moved to previous state');
        responder({
          topic: Message.PrevState,
          available: true
        });
      } else {
        console.log('Unsuccessfully moved to previous state');
        responder({
          topic: Message.PrevState,
          available: false
        });
      }
    });

    this.parentProcess.on(Message.DirectStateTransition, (data: DirectStateTransitionRequest, responder: Responder) => {
      console.log('Direct state transition', data.id);
      const index = SymbolIndex.getIndex(this.project.projectSymbols);
      const lastState = this.states[this.states.length - 1];
      const nextSymbol = index.get(data.id);
      let nextState: State;
      if (nextSymbol) {
        nextState = nextSymbol.stateFactory();
        if (lastState instanceof nextState.constructor && lastState.stateSymbolId === nextState.stateSymbolId) {
          nextState = lastState.nextState(data.id);
        }
      } else {
        // Used for templates
        nextState = lastState.nextState(data.id);
      }
      if (nextState) {
        this.states.push(nextState);
        console.log('Found next state');
        responder({
          topic: Message.DirectStateTransition,
          available: true
        });
        return;
      }
      console.log('No next state');
      responder({
        topic: Message.DirectStateTransition,
        available: false
      });
    });

    this.parentProcess.on(Message.GetSymbols, (data: GetSymbolsRequest, responder: Responder) => {
      console.log('Get symbols');
      let res: any[] = [];
      try {
        const map = SymbolIndex.getIndex(this.project.projectSymbols);
        map.forEach((data: SymbolData, id: string) => {
          if (data.symbol instanceof Symbol) {
            res.push(Object.assign({}, data.symbol.symbol, { id }));
          } else {
            const staticSymbol = new StaticSymbol('', getProviderName(data.symbol.getMetadata()), []);
            res.push(Object.assign({}, staticSymbol, { id }));
          }
        });
      } catch (e) {
        console.error(e);
      }
      responder({
        topic: Message.GetSymbols,
        symbols: res
      });
    });

    this.parentProcess.on(Message.GetMetadata, (data: GetMetadataRequest, responder: Responder) => {
      console.log('Getting metadata', data.id);
      if (this.state) {
        responder({
          topic: Message.GetMetadata,
          data: this.state.getMetadata(data.id)
        });
      } else {
        responder({
          topic: Message.GetMetadata,
          data: null
        });
      }
    });

    this.parentProcess.on(Message.GetData, (data: GetDataRequest, responder: Responder) => {
      console.log('Getting data');
      if (this.state) {
        responder({
          topic: Message.GetData,
          data: this.state.getData()
        });
      } else {
        responder({
          topic: Message.GetData,
          data: null
        });
      }
    });
  }

  get state(): State | undefined {
    return this.states[this.states.length - 1];
  }
}

new BackgroundApp().init();
