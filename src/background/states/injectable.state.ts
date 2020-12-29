import {
  Node,
  Metadata,
  VisualizationConfig,
  Layout,
  Direction,
  isAngularSymbol,
  SymbolTypes,
  getProviderId,
  getProviderName,
  Edge
} from '../../shared/data-format';
import { WorkspaceSymbols, InjectableSymbol } from 'ngast';
import { State } from './state';
import { getProviderMetadata } from '../formatters/model-formatter';

interface NodeMap {
  [id: string]: InjectableSymbol;
}

export class InjectableState extends State {
  private symbols: NodeMap = {};

  constructor(context: WorkspaceSymbols, protected injectable: InjectableSymbol) {
    super(context, getProviderId(injectable.metadata));
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
    return new InjectableState(this.context, symbol);
  }

  getData(): VisualizationConfig<InjectableSymbol> {
    const metadata = this.injectable.metadata;
    const existing: { [key: string]: number } = {};
    const currentId = getProviderId(metadata);
    const nodes: Node<InjectableSymbol>[] = [
      {
        id: currentId,
        data: this.injectable,
        label: getProviderName(metadata),
        type: {
          angular: isAngularSymbol(metadata),
          type: SymbolTypes.Injectable
        }
      }
    ];
    if (currentId) {
      existing[currentId] = 1;
    }
    (this.injectable.getDependencies() || []).forEach((injectable: InjectableSymbol) => {
      const dependencyMetadata = injectable.metadata;
      // Handle @SkipSelf()
      const id = getProviderId(dependencyMetadata);
      if (!id || !existing[id]) {
        nodes.push({
          id,
          data: injectable,
          label: getProviderName(dependencyMetadata),
          type: {
            angular: isAngularSymbol(injectable.metadata),
            type: SymbolTypes.Injectable
          }
        });
      }
      if (id) {
        existing[id] = (existing[id] || 0) + 1;
      }
    });
    if (currentId) {
      existing[currentId] -= 1;
    }
    nodes.forEach((node: Node<InjectableSymbol>) => node.data && node.id && (this.symbols[node.id] = node.data));
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
      title: getProviderName(this.injectable.metadata),
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
