import { VisualizationConfig, Metadata } from '../../shared/data-format';
import { WorkspaceSymbols } from 'ngast';

export abstract class State {
  constructor(protected context: WorkspaceSymbols, protected symbolId: string|null) {}

  abstract getMetadata(id: string): Metadata | null;

  abstract getData(): VisualizationConfig<any>;

  abstract nextState(id: string): State | null;

  destroy() {}

  get stateSymbolId() {
    return this.symbolId;
  }
}
