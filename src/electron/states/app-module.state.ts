import { State } from './state';
import { DirectiveState } from './directive.state';
import {
  Node,
  Edge,
  Metadata,
  getId,
  SymbolTypes,
  isAngularSymbol,
  VisualizationConfig,
  isThirdParty
} from '../../shared/data-format';
import { ComponentSymbol, DirectiveSymbol, InjectableSymbol, NgModuleSymbol, PipeSymbol, WorkspaceSymbols } from 'ngast';
import { getDirectiveMetadata, getInjectableMetadata, getPipeMetadata } from '../formatters/model-formatter';
import { ProviderState } from './provider.state';
import { PipeState } from './pipe.state';

interface DataType {
  symbol: InjectableSymbol | PipeSymbol | DirectiveSymbol | ComponentSymbol | NgModuleSymbol;
  metadata: any;
}

interface NodeMap {
  [id: string]: Node<DataType>;
}

export class AppModuleState extends State {
  private symbols: NodeMap = {};

  constructor(context: WorkspaceSymbols, protected module: NgModuleSymbol) {
    super(getId(module), context);
  }

  getMetadata(id: string): Metadata | null {
    const symbol = this.symbols[id];
    if (!symbol) {
      return null;
    }
    const data = symbol.data;
    if (!data) {
      return null;
    }
    if (data.symbol instanceof DirectiveSymbol || data.symbol instanceof ComponentSymbol) {
      return getDirectiveMetadata(data.symbol);
    } else if (data.symbol instanceof InjectableSymbol) {
      return getInjectableMetadata(data.symbol);
    } else if (data.symbol instanceof PipeSymbol) {
      return getPipeMetadata(data.symbol);
    }
    return null;
  }

  nextState(nodeId: string): State | null {
    if (nodeId === this.symbolId) {
      return null;
    }
    const data = this.symbols[nodeId].data;
    if (!data || !data.symbol) {
      return null;
    }
    // ngtsc does not allow us to resolve many of the properties
    // we need for third-party symbols so we don't allow the navigation.
    if (isThirdParty(data.symbol)) {
      return null;
    }
    if (data.symbol instanceof DirectiveSymbol || data.symbol instanceof ComponentSymbol) {
      return new DirectiveState(this.context, data.symbol);
    } else if (data.symbol instanceof InjectableSymbol) {
      return new ProviderState(this.context, data.symbol);
    } else if (data.symbol instanceof PipeSymbol) {
      return new PipeState(this.context, data.symbol);
    }
    return null;
  }

  getData(): VisualizationConfig<any> {
    const currentModuleId = getId(this.module);
    const nodes: NodeMap = {
      [currentModuleId]: {
        id: currentModuleId,
        label: this.module.name,
        data: {
          symbol: this.module,
          metadata: null
        },
        type: {
          angular: isAngularSymbol(this.module),
          type: SymbolTypes.Module
        }
      }
    };
    const edges: Edge[] = [];

    (this.module.getDeclarations() || []).forEach(node => {
      if (node instanceof PipeSymbol) {
        this._appendSet(currentModuleId, node, nodes, SymbolTypes.Pipe, edges);
      } else if (node instanceof DirectiveSymbol) {
        this._appendSet(currentModuleId, node, nodes, SymbolTypes.Directive, edges);
      } else {
        this._appendSet(currentModuleId, node, nodes, SymbolTypes.Component, edges);
      }
    });

    (this.module.getExports() || []).forEach(node => {
      if (node instanceof PipeSymbol) {
        this._appendSet(currentModuleId, node, nodes, SymbolTypes.Pipe, edges);
      } else if (node instanceof DirectiveSymbol) {
        this._appendSet(currentModuleId, node, nodes, SymbolTypes.Directive, edges);
      } else if (node instanceof ComponentSymbol) {
        this._appendSet(currentModuleId, node, nodes, SymbolTypes.Component, edges);
      }
    });

    (this.module.getProviders() || []).forEach(provider => {
      if (!(provider instanceof InjectableSymbol)) {
        return;
      }
      this._appendSet(currentModuleId, provider, nodes, SymbolTypes.Provider, edges);
    });

    this.symbols = nodes;
    return {
      title: this.module.name,
      graph: {
        nodes: Object.keys(nodes).map((id: string) => {
          const node = nodes[id];
          return {
            id,
            type: node.type,
            label: node.label
          };
        }),
        edges: edges
      }
    };
  }

  private _appendSet(
    parentSet: string,
    node: InjectableSymbol | PipeSymbol | DirectiveSymbol | ComponentSymbol,
    nodes: NodeMap,
    symbolType: SymbolTypes,
    edges: Edge[]
  ): void {
    const id = getId(node);
    const name = node.name;
    nodes[id] = {
      id,
      label: name,
      data: {
        symbol: node,
        metadata: null
      },
      type: {
        angular: isAngularSymbol(node),
        type: symbolType
      }
    };
    edges.push({
      from: parentSet,
      to: id
    });
  }
}
