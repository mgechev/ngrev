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
import {
  getDirectiveMetadata,
  getProviderMetadata,
  getPipeMetadata, getModuleMetadata
} from '../formatters/model-formatter';
import { ProviderState } from './provider.state';
import { PipeState } from './pipe.state';

interface DataType {
  symbol: InjectableSymbol | PipeSymbol | DirectiveSymbol | ComponentSymbol | NgModuleSymbol | null;
  metadata: any;
}

interface NodeMap {
  [id: string]: Node<DataType>;
}

const BootstrapId = '$$bootstrap';
const DeclarationsId = '$$declarations';
const ExportsId = '$$exports';
const ProvidersId = '$$providers';

export class ModuleState extends State {
  private symbols: NodeMap;

  constructor(context: WorkspaceSymbols, protected module: NgModuleSymbol) {
    super(getId(module), context);
  }

  getMetadata(id: string): Metadata | null {
    const data = this.symbols[id].data;
    if (!data) {
      return null;
    }
    if (data.symbol instanceof DirectiveSymbol || data.symbol instanceof ComponentSymbol) {
      return getDirectiveMetadata(data.symbol);
    } else if (data.symbol instanceof InjectableSymbol) {
      return getProviderMetadata(data.symbol);
    } else if (data.symbol instanceof PipeSymbol) {
      return getPipeMetadata(data.symbol);
    } else if (data.symbol instanceof NgModuleSymbol) {
      return getModuleMetadata(data.symbol);
    }
    return null;
  }

  nextState(nodeId: string): State | null {
    if (nodeId === this.symbolId) {
      return null;
    }
    const data = this.symbols[nodeId].data;
    if (!data) {
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
    const declarations = this.module.getDeclarations();
    if (declarations.length) {
      declarations.forEach(s => {
        const node = s;
        if (node instanceof PipeSymbol) {
          this._appendSet(DeclarationsId, s, nodes, SymbolTypes.Pipe, edges);
        } else {
          this._appendSet(DeclarationsId, s, nodes, SymbolTypes.ComponentOrDirective, edges);
        }
      });
      nodes[DeclarationsId] = {
        id: DeclarationsId,
        label: 'Declarations',
        data: {
          symbol: null,
          metadata: null
        },
        type: {
          angular: false,
          type: SymbolTypes.Meta
        }
      };
      edges.push({ from: currentModuleId, to: DeclarationsId });
    }

    const bootstrap = this.module.getBootstap();
    if (bootstrap.length) {
      bootstrap.forEach(s => {
        this._appendSet(BootstrapId, s, nodes, SymbolTypes.ComponentOrDirective, edges);
      });
      nodes[BootstrapId] = {
        id: BootstrapId,
        label: 'Bootstrap',
        data: {
          symbol: null,
          metadata: null
        },
        type: {
          angular: false,
          type: SymbolTypes.Meta
        }
      };
      edges.push({ from: currentModuleId, to: BootstrapId });
    }

    const exports = this.module.getExports();
    if (exports.length) {
      exports.forEach(node => {
        if (node instanceof PipeSymbol) {
          this._appendSet(ExportsId, node, nodes, SymbolTypes.Pipe, edges);
        } else if (node instanceof DirectiveSymbol || node instanceof ComponentSymbol) {
          this._appendSet(ExportsId, node, nodes, SymbolTypes.ComponentOrDirective, edges);
        }
      });
      nodes[ExportsId] = {
        id: ExportsId,
        label: 'Exports',
        data: {
          symbol: null,
          metadata: null
        },
        type: {
          angular: false,
          type: SymbolTypes.Meta
        }
      };
      edges.push({ from: currentModuleId, to: ExportsId });
    }
    const providers = this.module.getProviders().filter(provider => {
      if (!(provider instanceof InjectableSymbol)) {
        return false;
      }
      return true;
    }) as InjectableSymbol[];
    if (providers.length) {
      edges.push({ from: currentModuleId, to: ProvidersId });
      nodes[ProvidersId] = {
        id: ProvidersId,
        label: 'Providers',
        data: {
          symbol: null,
          metadata: null
        },
        type: {
          angular: false,
          type: SymbolTypes.Meta
        }
      };
      providers.forEach(provider => {
        this._appendSet(ProvidersId, provider, nodes, SymbolTypes.Provider, edges);
      });
    }
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
    node: InjectableSymbol | PipeSymbol | DirectiveSymbol | ComponentSymbol | NgModuleSymbol,
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
