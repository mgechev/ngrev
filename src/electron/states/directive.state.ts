import { ComponentSymbol, DirectiveSymbol, InjectableSymbol, TemplateNode, WorkspaceSymbols } from 'ngast';
import { State } from './state';
import {
  Direction,
  Edge,
  getId,
  isAngularSymbol,
  isThirdParty,
  Metadata,
  Node,
  SymbolTypes,
  VisualizationConfig,
} from '../../shared/data-format';
import { getDirectiveMetadata, getElementMetadata, } from '../formatters/model-formatter';
import { TemplateState } from './template.state';

interface NodeMap {
  [id: string]: DirectiveSymbol | ComponentSymbol | TemplateNode;
}

const TemplateId = 'template';
const DependenciesId = 'dependencies';
const ProvidersId = 'providers';

export class DirectiveState extends State {
  private symbols: NodeMap = {};

  constructor(
    context: WorkspaceSymbols,
    protected directive: DirectiveSymbol | ComponentSymbol,
    private showControl = true
  ) {
    super(getId(directive), context);
  }

  getMetadata(id: string): Metadata | null {
    const s = this.symbols[id];
    if (s) {
      if (s instanceof DirectiveSymbol || s instanceof ComponentSymbol) {
        return getDirectiveMetadata(s);
      } else {
        return getElementMetadata(s);
      }
    }
    return null;
  }

  nextState(id: string): State | null {
    console.log('State', id, this.directive instanceof ComponentSymbol);
    if (id === TemplateId && this.directive instanceof ComponentSymbol) {
      return new TemplateState(this.context, this.directive);
    }
    if (id === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[id];
    // ngtsc does not allow us to resolve many of the properties
    // we need for third-party symbols so we don't allow the navigation.
    if ((symbol instanceof ComponentSymbol || symbol instanceof DirectiveSymbol) &&
        isThirdParty(symbol)) {
      return null;
    }
    if (symbol instanceof DirectiveSymbol) {
      return new DirectiveState(this.context, symbol);
    } else {
      return null;
    }
  }

  getData(): VisualizationConfig<any> {
    const nodeId = getId(this.directive);
    const nodes: Node<DirectiveSymbol | ComponentSymbol>[] = [
      {
        id: nodeId,
        label: this.directive.name,
        data: this.directive,
        type: {
          type: (this.directive instanceof DirectiveSymbol) ? SymbolTypes.Directive : SymbolTypes.Component,
          angular: isAngularSymbol(this.directive),
        },
      },
    ];
    const edges: Edge[] = [];
    if (this.showControl) {
      if (this.directive instanceof ComponentSymbol) {
        nodes.push({
          id: TemplateId,
          label: 'Template',
          type: {
            type: SymbolTypes.Meta,
            angular: false,
          },
        });
        edges.push({
          from: nodeId,
          to: TemplateId,
        });
      }
      const addedSymbols: { [key: string]: boolean } = {};
      this.addProviderNodes(
        nodes,
        edges,
        addedSymbols,
        'Dependencies',
        DependenciesId,
        this.directive.getDependencies() as InjectableSymbol[]
      );
      console.log('Dependencies of the directive', this.directive.getDependencies());
      this.addProviderNodes(
        nodes,
        edges,
        addedSymbols,
        'Providers',
        ProvidersId,
        this.directive.getProviders() as InjectableSymbol[]
      );
    }
    return {
      title: this.directive.name,
      graph: {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
        })),
        edges,
      },
    };
  }

  private addProviderNodes(
    nodes: Node<any>[],
    edges: any[],
    addedSymbols: { [key: string]: boolean },
    rootLabel: string,
    rootId: string,
    providers: InjectableSymbol[]
  ): void {
    console.log('Total provider for directive', this.directive.name, providers.length);
    if (providers.length > 0) {
      nodes.push({
        id: rootId,
        label: rootLabel,
        type: {
          type: SymbolTypes.Meta,
          angular: false,
        },
      });
      edges.push({
        from: getId(this.directive),
        to: rootId,
      });
    }
    const existing = {};
    const directiveId = getId(this.directive);
    providers.forEach((p) => {
      const id = getId(p);
      if (id === null) {
        return;
      }
      existing[id] = parseInt((existing[id] || 0)) + 1;
      const node: Node<any> = {
        id,
        data: p,
        label: p.name,
        type: {
          angular: isAngularSymbol(p),
          type: SymbolTypes.Provider,
        },
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
        direction: Direction.To,
      });
    }
    Object.keys(existing).forEach((key: string) => {
      edges.push({
        from: rootId,
        to: key,
        direction: Direction.To,
      });
    });
    nodes.forEach((n) => {
      this.symbols[n.id] = n.data;
    });
  }
}
