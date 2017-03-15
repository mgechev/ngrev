import { State } from './state';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StaticSymbol, CompileNgModuleMetadata } from '@angular/compiler';
import { DataSet } from 'vis';
import { DirectiveState } from './directive.state';
import { Node, Edge, Metadata, getId, Direction, SymbolTypes, isAngularSymbol } from '../../shared/data-format';
import { DirectiveSymbol, ModuleSymbol, ContextSymbols, Symbol, ProviderSymbol, PipeSymbol } from 'ngast';
import { getDirectiveMetadata, getModuleMetadata, getProviderMetadata, getPipeMetadata } from '../formatters/model-formatter';
import { ProviderState } from './provider.state';
import { PipeState } from './pipe.state';

interface DataType {
  symbol: Symbol;
  metadata: any;
}

interface NodeMap {
  [id: string]: Node<DataType>;
}

const BootstrapId = '$$bootstrap';
const DeclarationsId = '$$declarations';
const ExportsId = '$$exports';
const ProvidersId = '$$providers';
const ModuleId = '$$module';

export class ModuleState extends State {

  private symbols: NodeMap;

  constructor(context: ContextSymbols, protected module: ModuleSymbol) {
    super(getId(module.symbol), context);
  }

  getMetadata(id: string): Metadata {
    const data = this.symbols[id].data;
    if (data.symbol instanceof DirectiveSymbol) {
      return getDirectiveMetadata(data.symbol);
    } else if (data.symbol instanceof ProviderSymbol) {
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
    } else if (data.symbol instanceof ProviderSymbol) {
      return new ProviderState(this.context, data.symbol);
    } else if (data.symbol instanceof PipeSymbol) {
      return new PipeState(this.context, data.symbol);
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
          metadata: null
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
      this._appendSet(BootstrapId, s, nodes, SymbolTypes.ComponentOrDirective, edges);
    });
    this.module.getDeclaredDirectives().forEach(s => {
      const node = s.symbol;
      this._appendSet(DeclarationsId, s, nodes, SymbolTypes.ComponentOrDirective, edges);
    });
    this.module.getExportedDirectives().forEach(d => {
      const node = d.symbol;
      this._appendSet(ExportsId, d, nodes, SymbolTypes.ComponentOrDirective, edges);
    });
    this.module.getDeclaredPipes().forEach(s => {
      const node = s.symbol;
      this._appendSet(DeclarationsId, s, nodes, SymbolTypes.Pipe, edges);
    });
    this.module.getExportedPipes().forEach(d => {
      const node = d.symbol;
      this._appendSet(ExportsId, d, nodes, SymbolTypes.Pipe, edges);
    });
    const providers = this.module.getProviders().reduce((prev: any, p) => {
      const id = getId(p.symbol);
      prev[id] = p;
      return prev;
    }, {});
    Object.keys(providers).forEach(key => {
      this._appendSet(ProvidersId, providers[key], nodes, SymbolTypes.Provider, edges);
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

  private _appendSet(parentSet: string, node: Symbol, nodes: NodeMap, symbolType: SymbolTypes, edges: Edge[]) {
    const symbol = node.symbol;
    const id = getId(symbol);
    nodes[id] = {
      id,
      label: symbol.name,
      data: {
        symbol: node,
        metadata: null
      },
      type: {
        angular: isAngularSymbol(symbol),
        type: symbolType
      }
    };
    edges.push({
      from: parentSet,
      to: id
    });
  }

}