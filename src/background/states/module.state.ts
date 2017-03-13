import { State } from './state';
import { ChangeDetectionStrategy } from '@angular/core';
import { StaticSymbol, CompileNgModuleMetadata } from '@angular/compiler';
import { DataSet } from 'vis';
import { DirectiveState } from './directive.state';
import { Node, Edge, Metadata, getId, Direction, SymbolTypes, isAngularSymbol } from '../../shared/data-format';
import { DirectiveSymbol, ModuleSymbol, ContextSymbols, Symbol, ProviderSymbol } from 'ngast';
import { getDirectiveMetadata, getModuleMetadata } from '../formatters/model-formatter';
import { ProviderState } from './provider.state';

interface DataType {
  symbol: Symbol;
  metadata: any;
}

interface NodeMap {
  [id: string]: Node<DataType>;
}

enum SymbolType {
  Directive,
  Provider,
  Meta
}

const BootstrapId = '$$bootstrap';
const DeclarationsId = '$$declarations';
const ExportsId = '$$exports';
const ProvidersId = '$$providers';
const ModuleId = '$$module';

export class ModuleState extends State {

  private symbols: NodeMap;

  constructor(context: ContextSymbols, protected module: ModuleSymbol) {
    super(context);
  }

  getMetadata(id: string): Metadata {
    const symbol = this.symbols[id];
    if (symbol && symbol.data.metadata) {
      return symbol.data.metadata;
    }
    return null;
  }

  nextState(nodeId: string) {
    const data = this.symbols[nodeId].data;
    if (!data) {
      return null;
    }
    if (data.symbol instanceof DirectiveSymbol) {
      return new DirectiveState(this.context, data.symbol);
    } else if (data.symbol instanceof ProviderSymbol) {
      return new ProviderState(this.context, data.symbol);
    }
    return null;
  }

  getData() {
    const nodes: NodeMap = {
      [ExportsId]: {
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
      },
      [BootstrapId]: {
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
      },
      [ProvidersId]: {
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
      },
      [DeclarationsId]: {
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
      },
      [ModuleId]: {
        id: ModuleId,
        label: this.module.symbol.name,
        data: {
          symbol: this.module,
          metadata: getModuleMetadata(this.module.symbol)
        },
        type: {
          angular: isAngularSymbol(this.module.symbol),
          type: SymbolTypes.Module
        }
      }
    };
    const edges = [
      { from: ModuleId, to: ExportsId },
      { from: ModuleId, to: BootstrapId },
      { from: ModuleId, to: ProvidersId },
      { from: ModuleId, to: DeclarationsId },
    ];
    this.module.getBootstrapComponents().forEach(s => {
      const node = s.symbol;
      this._appendSet(BootstrapId, s, nodes, SymbolType.Directive, edges);
    });
    this.module.getDeclaredDirectives().forEach(s => {
      const node = s.symbol;
      this._appendSet(DeclarationsId, s, nodes, SymbolType.Directive, edges);
    });
    this.module.getExportedDirectives().forEach(d => {
      const node = d.symbol;
      this._appendSet(ExportsId, d, nodes, SymbolType.Directive, edges);
    });
    const providers = this.module.getProviders().reduce((prev: any, p) => {
      const id = getId(p.symbol);
      prev[id] = p;
      return prev;
    }, {});
    Object.keys(providers).forEach(key => {
      this._appendSet(ProvidersId, providers[key], nodes, SymbolType.Provider, edges);
    });
    this.symbols = nodes;
    console.log(edges);
    return {
      graph: {
        nodes: Object.keys(nodes).map((key: string) => {
          const node: any = Object.assign({}, nodes[key]);
          node.id = key;
          return node;
        }),
        edges: edges
      }
    };
  }

  private _appendSet(parentSet: string, node: Symbol, nodes: NodeMap, symbolType: SymbolType, edges: Edge[]) {
    const symbol = node.symbol;
    const id = getId(symbol);
    nodes[id] = {
      id,
      label: symbol.name,
      data: {
        symbol: node,
        metadata: this._getMetadata(node, symbolType)
      },
      type: {
        angular: isAngularSymbol(symbol),
        type: parentSet === ExportsId || parentSet === BootstrapId ? SymbolTypes.Component : SymbolTypes.Provider
      }
    };
    edges.push({
      from: parentSet,
      to: id
    });
  }

  private _getMetadata(node: Symbol, type: SymbolType) {
    if (type === SymbolType.Directive) {
      return getDirectiveMetadata(node as DirectiveSymbol);
    } else if (type === SymbolType.Provider) {
      return null;
      // return this._getProviderMetadata(node as ProviderSymbol);
    }
  }
}