import { AppState } from './states/app.state';
import { SymbolIndex, SymbolData } from './model/symbol-index';
import { Message } from '../shared/ipc-constants';
import { State } from './states/state';
import { Project } from './model/project';
import { AnnotationNames, Symbol } from 'ngast';
import {
  ParentProcess,
  LoadProjectRequest,
  Responder,
  PrevStateRequest,
  DirectStateTransitionRequest,
  GetSymbolsRequest,
  GetMetadataRequest,
  GetDataRequest,
  LoadProjectResponse,
  PrevStateResponse,
  DirectStateTransitionResponse,
  GetSymbolsResponse,
  GetMetadataResponse,
  GetDataResponse,
  ToggleLibsRequest,
  ToggleLibsResponse,
  ToggleModulesRequest,
  ToggleModulesResponse
} from './helpers/process';
import { IdentifiedStaticSymbol } from '../shared/data-format';

export class BackgroundApp {
  private project?: Project;
  private states: State[] = [];
  private parentProcess = new ParentProcess();

  init(): void {
    this.parentProcess.on<LoadProjectRequest, LoadProjectResponse>(
      Message.LoadProject,
      (data: LoadProjectRequest, responder: Responder<LoadProjectResponse>) => {
        this.states.forEach(s => s.destroy());
        SymbolIndex.clear();

        this.states = [];
        console.log(`Loading project: "${data.tsconfig}"`);
        this.project = new Project();
        let parseError: any = null;
        try {
          this.project.load(data.tsconfig);
          const allModules = this.project.projectSymbols!.getAllModules();
          const bootstrapModule = allModules.filter(m => {
            const bootstrap = m.getBootstap();
            return bootstrap && bootstrap.length > 0;
          }).pop();
          if (!parseError) {
            const module = bootstrapModule ?? allModules[0];
            if (module) {
              console.log('Project loaded');
              this.states.push(new AppState(this.project.projectSymbols!, data.showLibs, data.showModules));
              console.log('Initial state created');
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
      }
    );

    this.parentProcess.on<PrevStateRequest, PrevStateResponse>(
      Message.PrevState,
      (data: PrevStateRequest, responder: Responder<PrevStateResponse>) => {
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
      }
    );

    this.parentProcess.on<DirectStateTransitionRequest, DirectStateTransitionResponse>(
      Message.DirectStateTransition,
      (data: DirectStateTransitionRequest, responder: Responder<DirectStateTransitionResponse>) => {
        console.log('Direct state transition', data.id);
        if (!this.project?.projectSymbols) {
          console.log('Project is not loaded yet');
          responder({
            topic: Message.DirectStateTransition,
            available: false
          });
          return;
        }
        const index = SymbolIndex.getIndex(this.project.projectSymbols);
        const lastState = this.states[this.states.length - 1];
        const nextSymbol = index.get(data.id);
        let nextState: State | null;
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
      }
    );

    this.parentProcess.on<GetSymbolsRequest, GetSymbolsResponse>(
      Message.GetSymbols,
      (data: GetSymbolsRequest, responder: Responder<GetSymbolsResponse>) => {
        console.log('Get symbols');
        if (!this.project?.projectSymbols) {
          console.log('Project is not loaded yet');
          return;
        }
        const res: IdentifiedStaticSymbol[] = [];
        try {
          const map = SymbolIndex.getIndex(this.project.projectSymbols);
          map.forEach((data: SymbolData<AnnotationNames>, id: string) => {
            if (data.symbol instanceof Symbol) {
              res.push({ id, name: data.symbol.name, annotation: data.symbol.annotation, path: data.symbol.path });
            }
          });
        } catch (e) {
          console.error(e);
        }
        responder({
          topic: Message.GetSymbols,
          symbols: res
        });
      }
    );

    this.parentProcess.on<GetMetadataRequest, GetMetadataResponse>(
      Message.GetMetadata,
      (data: GetMetadataRequest, responder: Responder<GetMetadataResponse>) => {
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
      }
    );

    this.parentProcess.on<GetDataRequest, GetDataResponse>(
      Message.GetData,
      (_: GetDataRequest, responder: Responder<GetDataResponse>) => {
        console.log('Getting data');
        if (this.state) {
          const data = this.state.getData();
          console.log('Getting data from state:', this.state.constructor.name, 'Got', data.graph.nodes.length, 'items');
          responder({
            topic: Message.GetData,
            data
          });
        } else {
          console.log('No state to get data from');
          responder({
            topic: Message.GetData,
            data: null
          });
        }
      }
    );

    this.parentProcess.on<ToggleLibsRequest, ToggleLibsResponse>(
      Message.ToggleLibs,
      (_: ToggleLibsRequest, responder: Responder<ToggleLibsResponse>) => {
        console.log('Toggle libraries');
        if (!this.project?.projectSymbols) {
          console.log('Project is not loaded yet');
          return;
        }
        const state = this.states.shift() as AppState;
        const newState = new AppState(this.project.projectSymbols, !state.showLibs, state.showModules);
        this.states.unshift(newState);
        responder({
          topic: Message.ToggleLibs
        });
      }
    );

    this.parentProcess.on<ToggleModulesRequest, ToggleModulesResponse>(
      Message.ToggleModules,
      (_: ToggleModulesRequest, responder: Responder<ToggleModulesResponse>) => {
        console.log('Toggle modules');
        if (!this.project?.projectSymbols) {
          console.log('Project is not loaded yet');
          return;
        }
        const state = this.states.shift() as AppState;
        const newState = new AppState(this.project.projectSymbols, state.showLibs, !state.showModules);
        this.states.unshift(newState);
        responder({
          topic: Message.ToggleModules
        });
      }
    );
  }

  get state(): State | undefined {
    return this.states[this.states.length - 1];
  }
}

new BackgroundApp().init();
