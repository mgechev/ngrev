import { Node, Metadata, getId, VisualizationConfig, Layout, Direction } from '../formatters/data-format';
import { StaticSymbol } from '@angular/compiler';
import { ContextSymbols, ProviderSymbol } from 'ngast';
import { State } from './state';

interface NodeMap {
  [id: string]: ProviderSymbol;
}

enum SymbolType {
  Directive,
  Provider,
  Meta
}

export class ProviderState extends State {

  private symbols: NodeMap;

  constructor(context: ContextSymbols, protected provider: ProviderSymbol) {
    super(context);
  }

  getMetadata(id: string): Metadata {
    return null;
  }

  nextState(nodeId: string) {
    const symbol = this.symbols[nodeId];
    if (!symbol) {
      return null;
    }
    return new ProviderState(this.context, symbol);
  }

  getData(): VisualizationConfig<ProviderSymbol> {
    const symbol = this.provider.symbol;
    const nodes: Node<ProviderSymbol>[] = [{
      id: getId(symbol),
      data: this.provider,
      label: symbol.name
    }];
    this.provider.getDependencies()
      .forEach(p => {
        nodes.push({
          id: getId(p.symbol),
          data: p,
          label: p.symbol.name
        });
      });
    const edges = nodes.slice(1, nodes.length).map(n => {
      return {
        from: getId(symbol),
        to: getId(n.data.symbol),
        direction: Direction.To
      }
    });
    return {
      layout: Layout.Regular,
      graph: { edges, nodes }
    };
  }

}