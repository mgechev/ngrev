import { State } from '../states/state';
import { ProjectSymbols, Symbol, ProviderSymbol } from 'ngast';
import { getId, getProviderId } from '../../shared/data-format';
import { PipeState } from '../states/pipe.state';
import { DirectiveState } from '../states/directive.state';
import { ProviderState } from '../states/provider.state';
import { ModuleTreeState } from '../states/module-tree.state';

export interface StateFactory {
  (): State;
}

export interface SymbolData {
  stateFactory: StateFactory;
  symbol: Symbol | ProviderSymbol;
}

export type Index = Map<string, SymbolData>;

export interface ISymbolIndex {
  getIndex(context: ProjectSymbols): Index;
  clear(): void;
}

class SymbolIndexImpl {
  private symbolsIndex: Index;

  getIndex(context: ProjectSymbols) {
    if (this.symbolsIndex && this.symbolsIndex.size) {
      return this.symbolsIndex;
    }
    this.symbolsIndex = new Map<string, SymbolData>();
    context.getPipes().forEach(symbol =>
      this.symbolsIndex.set(getId(symbol.symbol), {
        symbol,
        stateFactory() {
          return new PipeState(context, symbol);
        }
      })
    );
    context.getModules().forEach(symbol =>
      this.symbolsIndex.set(getId(symbol.symbol), {
        symbol,
        stateFactory() {
          return new ModuleTreeState(context, symbol);
        }
      })
    );
    context.getDirectives().forEach(symbol =>
      this.symbolsIndex.set(getId(symbol.symbol), {
        symbol,
        stateFactory() {
          return new DirectiveState(context, symbol);
        }
      })
    );
    context.getProviders().forEach(symbol =>
      this.symbolsIndex.set(getProviderId(symbol.getMetadata()), {
        symbol,
        stateFactory() {
          return new ProviderState(context, symbol);
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
