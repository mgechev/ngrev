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
import { State } from './state';
import { getInjectableMetadata } from '../formatters/model-formatter';
import { InjectableSymbol, WorkspaceSymbols } from 'ngast';

interface NodeMap {
  [id: string]: InjectableSymbol;
}

export class ProviderState extends State {
  private symbols: NodeMap = {};

  constructor(context: WorkspaceSymbols, protected provider: InjectableSymbol) {
    super(getId(provider), context);
  }

  getMetadata(id: string): Metadata {
    const s = this.symbols[id];
    if (s) {
      return getInjectableMetadata(this.symbols[id]);
    }
    return null;
  }

  nextState(nodeId: string): State {
    if (nodeId === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[nodeId];
    if (!symbol) {
      return null;
    }
    // ngtsc does not allow us to resolve many of the properties
    // we need for third-party symbols so we don't allow the navigation.
    if (isThirdParty(symbol)) {
      return null;
    }
    return new ProviderState(this.context, symbol);
  }

  getData(): VisualizationConfig<InjectableSymbol> {
    const existing: { [key: string]: number } = {};
    const currentId = getId(this.provider);
    const nodes: Node<InjectableSymbol>[] = [
      {
        id: currentId,
        data: this.provider,
        label: this.provider.name,
        type: {
          angular: isAngularSymbol(this.provider),
          type: SymbolTypes.Provider
        }
      }
    ];
    existing[currentId] = 1;
    (this.provider.getDependencies() || []).forEach(p => {
      if (!(p instanceof InjectableSymbol)) {
        return;
      }
      const id = getId(p);
      if (!existing[id]) {
        nodes.push({
          id,
          data: p,
          label: p.name,
          type: {
            angular: isAngularSymbol(p),
            type: SymbolTypes.Provider
          }
        });
      }
      existing[id] = (existing[id] || 0) + 1;
    });
    existing[currentId] -= 1;
    nodes.forEach(n => n.data && (this.symbols[n.id] = n.data));
    const resultEdges: Edge[] = [];

    // Show only a single arrow
    Object.keys(existing).forEach(id => {
      if (existing[id] >= 1) {
        resultEdges.push({
          from: currentId,
          to: id,
          direction: Direction.To
        });
      }
    });
    return {
      title: this.provider.name,
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
