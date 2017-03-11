import { DataSet } from 'vis';
import { StaticSymbol } from '@angular/compiler';
import { Project } from '../model/project-loader';
import { VisualizationConfig, Metadata } from '../formatters/data-format';
import { ContextSymbols } from 'ngast';

export abstract class State {
  constructor(protected context: ContextSymbols) {} 

  abstract getMetadata(id: string): Metadata;

  abstract getData(): VisualizationConfig<any>;

  abstract nextState(id: string): State;
}
