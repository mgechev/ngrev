import { VisualizationConfig, Metadata } from '../../shared/data-format';
import { WorkspaceSymbols } from 'ngast';

export abstract class State {
  constructor(protected symbolId: string, protected context: WorkspaceSymbols) {}

  abstract getMetadata(id: string): Metadata | null;

  abstract getData(): VisualizationConfig<any>;

  abstract nextState(id: string): State | null;

  destroy(): void {}

  get stateSymbolId(): string {
    return this.symbolId;
  }
}
