import {
  Node,
  Metadata,
  getId,
  VisualizationConfig,
  Layout,
  Direction,
  isAngularSymbol,
  SymbolTypes,
  Edge,
  isThirdParty
} from '../../shared/data-format';
import { InjectableSymbol, PipeSymbol, WorkspaceSymbols } from 'ngast';
import { State } from './state';
import { getInjectableMetadata, getPipeMetadata } from '../formatters/model-formatter';
import { ProviderState } from './provider.state';

interface NodeMap {
  [id: string]: InjectableSymbol | PipeSymbol;
}

export class PipeState extends State {
  private symbols: NodeMap = {};

  constructor(context: WorkspaceSymbols, protected pipe: PipeSymbol) {
    super(getId(pipe), context);
  }

  getMetadata(id: string): Metadata {
    const s = this.symbols[id];
    if (s) {
      if (s instanceof InjectableSymbol) {
        return getInjectableMetadata(s);
      } else {
        return getPipeMetadata(s);
      }
    }
    return null;
  }

  nextState(nodeId: string): State {
    if (nodeId === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[nodeId];
    if (symbol instanceof InjectableSymbol) {
      // ngtsc does not allow us to resolve many of the properties
      // we need for third-party symbols so we don't allow the navigation.
      if (!symbol || isThirdParty(symbol)) {
        return null;
      }
      return new ProviderState(this.context, symbol);
    }
    return null;
  }

  getData(): VisualizationConfig<InjectableSymbol> {
    const symbol = this.pipe;
    const nodes: Node<InjectableSymbol>[] = [
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
      if (!(p instanceof InjectableSymbol)) {
        return;
      }
      const m = p;
      nodes.push({
        id: getId(m),
        data: p,
        label: p.name,
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
          to: getId(data),
          direction: Direction.To
        });
      } else {
        console.warn('No data for ' + symbol.name);
      }
    });
    return {
      title: this.pipe.name,
      layout: Layout.Regular,
      graph: {
        edges: resultEdges,
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.label,
          type: n.type
        }))
      }
    };
  }
}
