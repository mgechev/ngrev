import { Component, NgZone } from '@angular/core';
import { Project } from '../model/project-loader';
import { Network } from 'vis';
import { ModuleFormatter } from '../formatters/module-formatter';
import { Module } from '../model/module';
import { State } from '../states/state';
import { ModuleTreeState } from '../states/module-tree.state';

@Component({
  selector: 'ngrev-app',
  template: `
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
  currentState: State;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.onProject('/Users/mgechev/Projects/angular-seed/src/client/tsconfig.json');
  }

  tryChangeState(nodeId: string) {
    const next = this.currentState.nextState(nodeId);
    if (next) {
      this.currentState = next;
    }
  }

  onProject(tsconfig: string) {
    this.ngZone.run(() => {
      let project = new Project();
      project.load(tsconfig)
        .then((rootModule: Module) => {
          this.currentState = new ModuleTreeState(project);
          this.project = project;
        });
    });
  }
}
