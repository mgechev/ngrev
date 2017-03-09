import { Component, NgZone } from '@angular/core';
import { Project } from '../model/project-loader';
import { Network } from 'vis';
import { ModuleFormatter } from '../formatters/module-formatter';
import { Module } from '../model/module';

@Component({
  selector: 'ngrev-app',
  template: `
    <ngrev-home *ngIf="!project" (project)="onProject($event)"></ngrev-home>
    <ngrev-visualizer *ngIf="project" [project]="project"></ngrev-visualizer>
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

  constructor(private ngZone: NgZone) {}

  onProject(tsconfig: string) {
    this.ngZone.run(() => {
      let project = new Project();
      project.load(tsconfig)
        .then((rootModule: Module) => {
          this.project = project;
        });
    });
  }
}
