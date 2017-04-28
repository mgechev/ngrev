import { DataSet } from 'vis';
import { StaticSymbol } from '@angular/compiler';
import { VisualizationConfig, Metadata } from '../../shared/data-format';
import { ProjectSymbols } from 'ngast';

export abstract class State {
  constructor(protected symbolId: string, protected context: ProjectSymbols) {}

  abstract getMetadata(id: string): Metadata | null;

  abstract getData(): VisualizationConfig<any>;

  abstract nextState(id: string): State | null;
}
