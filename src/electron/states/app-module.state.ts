import { State } from './state';
import { DirectiveState } from './directive.state';
import {
  Node,
  Edge,
  Metadata,
  getId,
  SymbolTypes,
  isAngularSymbol,
  VisualizationConfig
} from '../../shared/data-format';
import { ComponentSymbol, DirectiveSymbol, InjectableSymbol, NgModuleSymbol, PipeSymbol, WorkspaceSymbols } from 'ngast';
import { getDirectiveMetadata, getProviderMetadata, getPipeMetadata } from '../formatters/model-formatter';
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
  private symbols: NodeMap;

  constructor(context: WorkspaceSymbols, protected module: NgModuleSymbol) {
    super(getId(module), context);
  }

  getMetadata(id: string): Metadata | null {
    const data = this.symbols[id].data;
    if (!data) {
      return null;
    }
    if (data.symbol instanceof DirectiveSymbol) {
      return getDirectiveMetadata(data.symbol);
    } else if (data.symbol instanceof InjectableSymbol) {
      return getProviderMetadata(data.symbol);
    } else if (data.symbol instanceof PipeSymbol) {
      return getPipeMetadata(data.symbol);
    }
    return null;
  }

  nextState(nodeId: string) {
    if (nodeId === this.symbolId) {
      return null;
    }
    const data = this.symbols[nodeId].data;
    if (!data) {
      return null;
    }
    if (data.symbol instanceof DirectiveSymbol) {
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
    const declarations = this.module.getDeclarations();
    if (declarations.length) {
      declarations.forEach(node => {
        if (node instanceof PipeSymbol) {
          this._appendSet(currentModuleId, node, nodes, SymbolTypes.Pipe, edges);
        } else {
          this._appendSet(currentModuleId, node, nodes, SymbolTypes.ComponentOrDirective, edges);
        }
      });
    }

    const exports = this.module.getExports();
    if (exports.length) {
      exports.forEach(node => {
        if (node instanceof PipeSymbol) {
          this._appendSet(currentModuleId, node, nodes, SymbolTypes.Pipe, edges);
        } else if (node instanceof DirectiveSymbol || node instanceof ComponentSymbol) {
          this._appendSet(currentModuleId, node, nodes, SymbolTypes.ComponentOrDirective, edges);
        }
      });
    }
    const providers = this.module.getProviders().reduce((prev: any, p) => {
      if (!(p instanceof InjectableSymbol)) {
        return prev;
      }
      const id = getId(p);
      prev[id] = p;
      return prev;
    }, {});
    Object.keys(providers).forEach(key => {
      this._appendSet(currentModuleId, providers[key], nodes, SymbolTypes.Provider, edges);
    });
    this.symbols = nodes;
    return {
      title: this.module.name,
      graph: {
        nodes: Object.keys(nodes).map((key: string) => {
          const node: any = Object.assign({}, nodes[key]);
          node.id = key;
          return {
            id: node.id,
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
  ) {
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
