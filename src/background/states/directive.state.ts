import { DirectiveSymbol, ProjectSymbols, ProviderSymbol } from 'ngast';
import { State } from './state';
import { ElementAst, StaticSymbol, DirectiveAst } from '@angular/compiler';
import {
  VisualizationConfig,
  Metadata,
  getId,
  Node,
  isAngularSymbol,
  SymbolTypes,
  Direction,
  getProviderId,
  getProviderName,
  Edge
} from '../../shared/data-format';
import { getDirectiveMetadata, getElementMetadata, getProviderMetadata } from '../formatters/model-formatter';
import { TemplateState } from './template.state';
import { ProviderState } from './provider.state';

interface NodeMap {
  [id: string]: ProviderSymbol | DirectiveSymbol | ElementAst;
}

const TemplateId = 'template';
const DependenciesId = 'dependencies';
const ViewProvidersId = 'view-providers';
const ProvidersId = 'providers';

export class DirectiveState extends State {
  private symbols: NodeMap = {};

  constructor(context: ProjectSymbols, protected directive: DirectiveSymbol, private showControl = true) {
    super(getId(directive.symbol), context);
  }

  getMetadata(id: string): Metadata | null {
    const s = this.symbols[id];
    console.log(Object.keys(this.symbols));
    if (s) {
      if (s instanceof ElementAst) {
        return getElementMetadata(s);
      } else if (s instanceof DirectiveSymbol) {
        return getDirectiveMetadata(s);
      } else if (s instanceof ProviderSymbol) {
        return getProviderMetadata(s);
      }
    }
    return null;
  }

  nextState(id: string) {
    if (id === TemplateId) {
      return new TemplateState(this.context, this.directive);
    }
    if (id === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[id];
    if (symbol instanceof DirectiveSymbol) {
      return new DirectiveState(this.context, symbol);
    } else if (symbol instanceof ProviderSymbol) {
      return new ProviderState(this.context, symbol);
    } else {
      return null;
    }
  }

  getData(): VisualizationConfig<any> {
    const s = this.directive.symbol;
    const nodeId = getId(s);
    const nodes: Node<DirectiveSymbol>[] = [
      {
        id: nodeId,
        label: s.name,
        data: this.directive,
        type: {
          type: SymbolTypes.Component,
          angular: isAngularSymbol(s)
        }
      }
    ];
    const edges: Edge[] = [];
    if (this.showControl) {
      if (this.directive.isComponent()) {
        nodes.push({
          id: TemplateId,
          label: 'Template',
          type: {
            type: SymbolTypes.Meta,
            angular: false
          }
        });
        edges.push({
          from: nodeId,
          to: TemplateId
        });
      }
      const addedSymbols: { [key: string]: boolean } = {};
      this.addProviderNodes(
        nodes,
        edges,
        addedSymbols,
        'Dependencies',
        DependenciesId,
        this.directive.getDependencies()
      );
      this.addProviderNodes(nodes, edges, addedSymbols, 'Providers', ProvidersId, this.directive.getProviders());
      this.addProviderNodes(
        nodes,
        edges,
        addedSymbols,
        'View Providers',
        ViewProvidersId,
        this.directive.getViewProviders()
      );
    }
    return {
      title: this.directive.symbol.name,
      graph: {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.label
        })),
        edges
      }
    };
  }

  private addProviderNodes(
    nodes: Node<any>[],
    edges: any[],
    addedSymbols: { [key: string]: boolean },
    rootLabel: string,
    rootId: string,
    providers: ProviderSymbol[]
  ) {
    if (providers.length > 0) {
      nodes.push({
        id: rootId,
        label: rootLabel,
        type: {
          type: SymbolTypes.Meta,
          angular: false
        }
      });
      edges.push({
        from: getId(this.directive.symbol),
        to: rootId
      });
    }
    const existing = {};
    const directiveId = getId(this.directive.symbol);
    providers.forEach(p => {
      const m = p.getMetadata();
      const id = getProviderId(m);
      existing[id] = (existing[id] || 0) + 1;
      const node = {
        id,
        data: p,
        label: getProviderName(m),
        type: {
          angular: isAngularSymbol(m),
          type: SymbolTypes.Provider
        }
      };
      // Handle circular references
      if (!addedSymbols[id]) {
        nodes.push(node);
        addedSymbols[id] = true;
      }
    });
    if (existing[directiveId]) {
      edges.push({
        from: rootId,
        to: directiveId,
        direction: Direction.To
      });
    }
    Object.keys(existing).forEach((key: string) => {
      edges.push({
        from: rootId,
        to: key,
        direction: Direction.To
      });
    });
    nodes.forEach(n => {
      this.symbols[n.id] = n.data;
    });
  }
}
