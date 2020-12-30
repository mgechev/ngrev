import { State } from '../states/state';
import { Symbol, WorkspaceSymbols, AnnotationNames } from 'ngast';
import { getId } from '../../shared/data-format';
import { PipeState } from '../states/pipe.state';
import { DirectiveState } from '../states/directive.state';
import { ModuleTreeState } from '../states/module-tree.state';
import { textSpanContainsTextSpan } from 'typescript';
import { ProviderState } from '../states/provider.state';

export interface StateFactory {
  (): State;
}

export interface SymbolData {
  stateFactory: StateFactory;
  symbol: Symbol<AnnotationNames>;
}

export type Index = Map<string, SymbolData>;

export interface ISymbolIndex {
  getIndex(context: WorkspaceSymbols): Index;
  clear(): void;
}

class SymbolIndexImpl {
  private symbolsIndex: Index;

  getIndex(context: WorkspaceSymbols) {
    if (this.symbolsIndex && this.symbolsIndex.size) {
      return this.symbolsIndex;
    }
    this.symbolsIndex = new Map<string, SymbolData>();
    context.getAllInjectable().forEach(symbol => {
      this.symbolsIndex.set(getId(symbol), {
        symbol,
        stateFactory() {
          return new ProviderState(context, symbol);
        }
      });
    });
    context.getAllPipes().forEach(symbol =>
      this.symbolsIndex.set(getId(symbol), {
        symbol,
        stateFactory() {
          return new PipeState(context, symbol);
        }
      })
    );
    context.getAllModules().forEach(symbol =>
      this.symbolsIndex.set(getId(symbol), {
        symbol,
        stateFactory() {
          return new ModuleTreeState(context, symbol);
        }
      })
    );
    context.getAllDirectives().forEach(symbol =>
      this.symbolsIndex.set(getId(symbol), {
        symbol,
        stateFactory() {
          return new DirectiveState(context, symbol);
        }
      })
    );
    return this.symbolsIndex;
  }

  clear() {
    this.symbolsIndex = new Map<string, SymbolData>();
  }
}

export const SymbolIndex: ISymbolIndex = new SymbolIndexImpl();
