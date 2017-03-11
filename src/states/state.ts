import { DataSet } from 'vis';
import { StaticSymbol } from '@angular/compiler';
import { Project } from '../model/project-loader';
import { Visualization } from '../formatters/data-format';

export abstract class State {
  constructor(protected project: Project) {} 

  abstract getData(): Visualization<any>;

  abstract nextState(id: string): State;
}
