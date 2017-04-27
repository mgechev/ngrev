import { State } from '../states/state';
import { ProjectSymbols, Symbol } from 'ngast';
import { getId } from '../../shared/data-format';
import { PipeState } from '../states/pipe.state';
import { ModuleState } from '../states/module.state';
import { DirectiveState } from '../states/directive.state';
import { ProviderState } from '../states/provider.state';

export interface StateFactory {
  (): State;
}

export interface SymbolData {
  stateFactory: StateFactory;
  symbol: Symbol;
}

export type Index = Map<string, SymbolData>;

export interface ISymbolIndex {
  getIndex(context: ProjectSymbols): Index;
}

class SymbolIndexImpl {
  private symbolsIndex: Index;

  getIndex(context: ProjectSymbols) {
    if (this.symbolsIndex) {
      return this.symbolsIndex;
    }
    this.symbolsIndex = new Map<string, SymbolData>();
    context.getPipes()
      .forEach(symbol => this.symbolsIndex.set(getId(symbol.symbol), {
        symbol, stateFactory() {
          return new PipeState(context, symbol);
        }
      }));
    context.getModules()
      .forEach(symbol => this.symbolsIndex.set(getId(symbol.symbol), {
        symbol, stateFactory() {
          return new ModuleState(context, symbol);
        }
      }));
    context.getDirectives()
      .forEach(symbol => this.symbolsIndex.set(getId(symbol.symbol), {
        symbol, stateFactory() {
          return new DirectiveState(context, symbol);
        }
      }));
    context.getProviders()
      .forEach(symbol => this.symbolsIndex.set(getId(symbol.symbol), {
        symbol, stateFactory() {
          return new ProviderState(context, symbol);
        }
      }))
    return this.symbolsIndex;
  }
}

export const SymbolIndex: ISymbolIndex = new SymbolIndexImpl();
