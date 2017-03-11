import { State, Graph } from './state';
import { StaticSymbol } from '@angular/compiler';
import { ModuleFormatter } from '../formatters/module-formatter';
import { Project } from '../model/project-loader';
import { DataSet } from 'vis';
import { Module } from '../model/module';
import { ModuleState } from './module.state';

export class ModuleTreeState extends State {
  private data: Graph;

  constructor(project: Project) {
    super(project);
    this.data = new ModuleFormatter().format(this.project.getRootModule())
  }

  getData() {
    return this.data;
  }

  // Switch to binary search if gets too slow.
  nextState(id: string) {
    let module: Module;
    this.data.nodes.forEach((item: any, nodeId: string) => {
      if (id === nodeId) {
        module = item.module;
      }
    });
    return new ModuleState(this.project, module);
  }
}
