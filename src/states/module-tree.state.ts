import { State } from './state';
import { StaticSymbol } from '@angular/compiler';
import { ModuleFormatter } from '../formatters/module-formatter';
import { Project } from '../model/project-loader';
import { DataSet } from 'vis';
import { Module } from '../model/module';
import { ModuleState } from './module.state';
import { Visualization, Layout, Node } from '../formatters/data-format';

export class ModuleTreeState extends State {
  private data: Visualization<Module>;

  constructor(project: Project) {
    super(project);
    this.data = {
      layout: Layout.Regular,
      graph: new ModuleFormatter().format(this.project.getRootModule())
    };
  }

  getData(): Visualization<Module> {
    return this.data;
  }

  // Switch to binary search if gets too slow.
  nextState(id: string) {
    let module: Module;
    this.data.graph.nodes.forEach((node: Node<Module>) => {
      if (id === node.id) {
        module = node.data;
      }
    });
    return new ModuleState(this.project, module);
  }
}
