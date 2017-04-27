import { Node, Metadata, getId, VisualizationConfig, Layout, Direction, isAngularSymbol, SymbolTypes, getProviderId, getProviderName } from '../../shared/data-format';
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
    const nodes: Node<ProviderSymbol>[] = [{
      id: getProviderId(metadata),
      data: this.provider,
      label: getProviderName(metadata),
      type: {
        angular: isAngularSymbol(metadata),
        type: SymbolTypes.Provider
      }
    }];
    (this.provider.getDependencies() || [])
      .forEach(p => {
        const dependencyMetadata = p.getMetadata();
        nodes.push({
          id: getProviderId(dependencyMetadata),
          data: p,
          label: getProviderName(dependencyMetadata),
          type: {
            angular: isAngularSymbol(p.getMetadata()),
            type: SymbolTypes.Provider
          }
        });
      });
    nodes.forEach(n => {
      this.symbols[n.id] = n.data;
    });
    const edges = nodes.slice(1, nodes.length).map(n => {
      return {
        from: getProviderId(metadata),
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
