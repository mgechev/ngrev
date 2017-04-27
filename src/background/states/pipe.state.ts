import { Node, Metadata, getId, VisualizationConfig, Layout, Direction, isAngularSymbol, SymbolTypes, getProviderId, getProviderName } from '../../shared/data-format';
import { StaticSymbol } from '@angular/compiler';
import { ProjectSymbols, ProviderSymbol, PipeSymbol } from 'ngast';
import { State } from './state';
import { getProviderMetadata, getPipeMetadata } from '../formatters/model-formatter';
import { ProviderState } from './provider.state';

interface NodeMap {
  [id: string]: ProviderSymbol | PipeSymbol;
}

export class PipeState extends State {

  private symbols: NodeMap = {};

  constructor(context: ProjectSymbols, protected pipe: PipeSymbol) {
    super(getId(pipe.symbol), context);
  }

  getMetadata(id: string): Metadata {
    const s = this.symbols[id];
    if (s instanceof ProviderSymbol) {
      return getProviderMetadata(s);
    } else {
      return getPipeMetadata(s);
    }
  }

  nextState(nodeId: string) {
    if (nodeId === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[nodeId];
    if (symbol instanceof ProviderSymbol) {
      if (!symbol) {
        return null;
      }
      return new ProviderState(this.context, symbol);
    }
    return null;
  }

  getData(): VisualizationConfig<ProviderSymbol> {
    const symbol = this.pipe.symbol;
    const nodes: Node<ProviderSymbol>[] = [{
      id: getId(symbol),
      data: this.pipe as any,
      label: symbol.name,
      type: {
        angular: isAngularSymbol(symbol),
        type: SymbolTypes.Pipe
      }
    }];
    (this.pipe.getDependencies() || [])
      .forEach(p => {
        const m = p.getMetadata();
        nodes.push({
          id: getProviderId(m),
          data: p,
          label: getProviderName(m),
          type: {
            angular: isAngularSymbol(m),
            type: SymbolTypes.Provider
          }
        });
      });
    nodes.forEach(n => {
      this.symbols[n.id] = n.data;
    });
    const edges = nodes.slice(1, nodes.length).map(n => {
      return {
        from: getId(symbol),
        to: getProviderId(n.data.getMetadata()),
        direction: Direction.To
      }
    });
    return {
      layout: Layout.Regular,
      graph: { edges, nodes }
    };
  }

}
