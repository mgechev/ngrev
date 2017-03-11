import { Component, NgZone } from '@angular/core';
import { Project } from '../model/project-loader';
import { Network } from 'vis';
import { State } from '../states/state';
import { ModuleTreeState } from '../states/module-tree.state';
import { ContextSymbols } from 'ngast';

@Component({
  selector: 'ngrev-app',
  template: `
    <button [disabled]="states.length <= 1" (click)="prevState()">Back</button>
    <ngrev-home *ngIf="!project" (project)="onProject($event)"></ngrev-home>
    <ngrev-visualizer *ngIf="project" [state]="currentState" (select)="tryChangeState($event)">
    </ngrev-visualizer>
  `,
  styles: [`
    :host {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class AppComponent {
  project: Project = null;

  private states: State[] = [];

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.onProject('/Users/mgechev/Projects/angular-seed/src/client/tsconfig.json');
  }

  tryChangeState(nodeId: string) {
    const next = this.currentState.nextState(nodeId);
    if (next) {
      this.states.push(next);
    }
  }

  get currentState() {
    return this.states[this.states.length - 1];
  }

  onProject(tsconfig: string) {
    this.ngZone.run(() => {
      let project = new Project();
      project.load(tsconfig)
        .then((rootContext: ContextSymbols) => {
          const allModules = rootContext.getModules();
          const rootSymbol = rootContext.getContextSummary().type.reference;
          const module = 
            allModules
              .filter(m => m.symbol.name === rootSymbol.name && m.symbol.filePath === rootSymbol.filePath)
              .pop();
          this.states.push(new ModuleTreeState(rootContext, module));
          this.project = project;
        });
    });
  }

  prevState() {
    if (this.states.length > 1) {
      this.states.pop();
    }
  }
}
