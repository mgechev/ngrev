import {
  Node,
  Metadata,
  getId,
  VisualizationConfig,
  Layout,
  Direction,
  isAngularSymbol,
  SymbolTypes,
  getProviderId,
  getProviderName,
  Edge
} from '../../shared/data-format';
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
    const nodes: Node<ProviderSymbol>[] = [
      {
        id: getId(symbol),
        data: this.pipe as any,
        label: symbol.name,
        type: {
          angular: isAngularSymbol(symbol),
          type: SymbolTypes.Pipe
        }
      }
    ];
    (this.pipe.getDependencies() || []).forEach(p => {
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
    nodes.forEach(n => n.data && (this.symbols[n.id] = n.data));
    const resultEdges: Edge[] = [];
    const edges = nodes.slice(1, nodes.length).forEach(n => {
      const data = n.data;
      if (data) {
        resultEdges.push({
          from: getId(symbol),
          to: getProviderId(data.getMetadata()),
          direction: Direction.To
        });
      } else {
        console.warn('No data for ' + symbol.name);
      }
    });
    return {
      title: this.pipe.symbol.name,
      layout: Layout.Regular,
      graph: { edges: resultEdges, nodes }
    };
  }
}
