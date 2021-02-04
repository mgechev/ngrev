import { Metadata, VisualizationConfig, Config, IdentifiedStaticSymbol } from '../../shared/data-format';
import { fork, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { Message } from '../../shared/ipc-constants';

export interface LoadProjectRequest {
  showLibs: boolean;
  showModules: boolean;
  topic: Message.LoadProject;
  tsconfig: string;
}

export interface LoadProjectResponse {
  topic: Message.LoadProject;
  err: string | null;
}

export interface PrevStateRequest {
  topic: Message.PrevState;
}

export interface PrevStateResponse {
  topic: Message.PrevState;
  available: boolean;
}

export interface DirectStateTransitionRequest {
  topic: Message.DirectStateTransition;
  id: string;
}

export interface DirectStateTransitionResponse {
  topic: Message.DirectStateTransition;
  available: boolean;
}

export interface GetSymbolsRequest {
  topic: Message.GetSymbols;
}

export interface GetSymbolsResponse {
  topic: Message.GetSymbols;
  symbols: IdentifiedStaticSymbol[];
}

export interface GetMetadataRequest {
  topic: Message.GetMetadata;
  id: string;
}

export interface GetMetadataResponse {
  topic: Message.GetMetadata;
  data: Metadata | null;
}

export interface GetDataRequest {
  topic: Message.GetData;
}

export interface GetDataResponse {
  topic: Message.GetData;
  data: VisualizationConfig<any> | null;
}

export interface ConfigRequest {
  topic: Message.Config;
}

export interface ConfigResponse {
  topic: Message.Config;
  data: Config;
}

export interface ToggleLibsResponse {
  topic: Message.ToggleLibs;
}

export interface ToggleLibsRequest {
  topic: Message.ToggleLibs;
}

export interface ToggleModulesResponse {
  topic: Message.ToggleModules;
}

export interface ToggleModulesRequest {
  topic: Message.ToggleModules;
}


export type IPCRequest =
  | LoadProjectRequest
  | PrevStateRequest
  | DirectStateTransitionRequest
  | GetSymbolsRequest
  | GetMetadataRequest
  | GetDataRequest
  | ConfigRequest
  | ToggleLibsRequest
  | ToggleModulesRequest;

export type IPCResponse =
  | LoadProjectResponse
  | PrevStateResponse
  | DirectStateTransitionResponse
  | GetSymbolsResponse
  | GetMetadataResponse
  | GetDataResponse
  | ConfigResponse
  | ToggleLibsResponse
  | ToggleModulesResponse;

export interface Responder<R> {
  (data: R): void;
}

export interface RequestHandler<T, R> {
  (request: T, responder: Responder<R>): void;
}

export class ParentProcess {
  private emitter = new EventEmitter();

  constructor() {
    process.on('message' as any, (request: IPCRequest) => {
      console.log('Got message from the parent process with topic:', request.topic);
      this.emitter.emit(request.topic, request, ((response: IPCResponse) => {
        console.log('Sending response for message:', request.topic);
        (process as any).send(response);
      }) as Responder<IPCRequest>);
    });
  }

  on<T extends IPCRequest, R extends IPCResponse>(topic: Message, cb: RequestHandler<T, R>): void {
    this.emitter.on(topic, (request: T, responder: Responder<R>) => {
      try {
        cb(request, responder);
      } catch (e) {
        console.log('Error while responding to a message', e);
        responder({
          topic: topic
        } as any);
      }
    });
  }
}

export class SlaveProcess {
  private emitter = new EventEmitter();

  constructor(private process: ChildProcess, private moduleUrl: string, private initArgs: string[]) {}

  static create(moduleUrl: string, ...args: string[]): SlaveProcess {
    const slaveProcess = fork(moduleUrl, args);
    const result = new SlaveProcess(slaveProcess, moduleUrl, args);
    slaveProcess.on('error', err => {
      console.error(err);
    });
    return result;
  }

  get connected(): boolean {
    return this.process.connected;
  }

  onReady(cb: () => void): void {
    this.emitter.on('ready', cb);
  }

  send<R extends IPCResponse>(request: IPCRequest): Promise<R> {
    return new Promise((resolve) => {
      this.process.once('message', (data: R) => {
        console.log('Got message with topic', data.topic);
        resolve(data);
      });
      this.process.send(request);
    });
  }
}
