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
import { ProjectSymbols, ProviderSymbol } from 'ngast';
import { State } from './state';
import { getProviderMetadata } from '../formatters/model-formatter';

interface NodeMap {
  [id: string]: ProviderSymbol;
}

enum SymbolType {
  Directive,
  Provider,
  Meta
}

export class ProviderState extends State {
  private symbols: NodeMap = {};

  constructor(context: ProjectSymbols, protected provider: ProviderSymbol) {
    super(getProviderId(provider.getMetadata()), context);
  }

  getMetadata(id: string): Metadata {
    return getProviderMetadata(this.symbols[id]);
  }

  nextState(nodeId: string) {
    if (nodeId === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[nodeId];
    if (!symbol) {
      return null;
    }
    return new ProviderState(this.context, symbol);
  }

  getData(): VisualizationConfig<ProviderSymbol> {
    const metadata = this.provider.getMetadata();
    const existing: { [key: string]: number } = {};
    const currentId = getProviderId(metadata);
    const nodes: Node<ProviderSymbol>[] = [
      {
        id: currentId,
        data: this.provider,
        label: getProviderName(metadata),
        type: {
          angular: isAngularSymbol(metadata),
          type: SymbolTypes.Provider
        }
      }
    ];
    existing[currentId] = 1;
    (this.provider.getDependencies() || []).forEach(p => {
      const dependencyMetadata = p.getMetadata();
      // Handle @SkipSelf()
      const id = getProviderId(dependencyMetadata);
      if (!existing[id]) {
        nodes.push({
          id,
          data: p,
          label: getProviderName(dependencyMetadata),
          type: {
            angular: isAngularSymbol(p.getMetadata()),
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
      title: getProviderName(this.provider.getMetadata()),
      layout: Layout.Regular,
      graph: { edges: resultEdges, nodes }
    };
  }
}
