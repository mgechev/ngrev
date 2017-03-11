import { DataSet } from 'vis';
import { StaticSymbol } from '@angular/compiler';
import { Project } from '../model/project-loader';

export interface Graph {
  nodes: DataSet<any>;
  edges: DataSet<any>;
}

export abstract class State {
  constructor(protected project: Project) {} 

  abstract getData(): Graph;

  abstract nextState(id: string): State;
}
