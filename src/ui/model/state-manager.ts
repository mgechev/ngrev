import { IPCBus } from './ipc-bus';
import { Injectable } from '@angular/core';
import { VisualizationConfig, Metadata } from '../../shared/data-format';
import { AppComponent } from '../components/app.component';
import { ProjectProxy } from './project-proxy';
import { StateProxy } from '../states/state-proxy';
import { ProjectSymbols } from 'ngast';
import { isMetaNodeId } from '../shared/utils';

export class Memento {
  constructor(public state: VisualizationConfig<any>) {}
}

@Injectable()
export class StateManager {
  private history: Memento[] = [];
  private lastTransition: string | null = null;
  private transitionInProgress: string | null = null;
  private transitionResolveQueue: { resolve: Function; reject: Function }[] = [];

  constructor(private project: ProjectProxy, private state: StateProxy, private bus: IPCBus) {}

  getHistory() {
    return this.history;
  }

  loadProject(tsconfig: string) {
    return this.project
      .load(tsconfig)
      .then((rootContext: ProjectSymbols) => (this.state = new StateProxy()))
      .then((proxy: StateProxy) => proxy.getData())
      .then(data => this.history.push(new Memento(data)));
  }

  tryChangeState(id: string) {
    if (this.transitionInProgress && this.transitionInProgress !== id) {
      return Promise.reject(new Error('Cannot change state while transition is pending.'));
    } else if (this.transitionInProgress === id) {
      return new Promise((resolve, reject) => this.transitionResolveQueue.push({ resolve, reject }));
    }
    if (!this.transitionInProgress) {
      this.transitionInProgress = id;
    }
    return this.state
      .directStateTransfer(id)
      .then(() => this.state.getData())
      .then(data => {
        this.lastTransition = id;
        this.pushState(data);
        while (this.transitionResolveQueue.length) {
          const res = this.transitionResolveQueue.pop();
          if (res) {
            res.resolve(data);
          }
        }
        this.transitionInProgress = null;
        return data;
      })
      .catch(e => {
        while (this.transitionResolveQueue.length) {
          const res = this.transitionResolveQueue.pop();
          if (res) {
            res.reject(e);
          }
        }
        this.transitionInProgress = null;
        return Promise.reject(e);
      });
  }

  getCurrentState() {
    const last = this.history[this.history.length - 1];
    if (last) {
      return last.state;
    } else {
      return null;
    }
  }

  getMetadata(nodeId: string) {
    return this.state.getMetadata(nodeId);
  }

  async restoreMemento(memento: Memento) {
    return new Promise(async (resolve, reject) => {
      try {
        while (true && this.history.length) {
          const last = this.history[this.history.length - 1];
          if (last === memento) {
            break;
          } else {
            await this.popState();
          }
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  private pushState(data: VisualizationConfig<any>) {
    this.history.push(new Memento(data));
  }

  private popState() {
    return this.state.prevState().then(() => this.history.pop());
  }
}
