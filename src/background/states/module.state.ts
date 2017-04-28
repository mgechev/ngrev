import { State } from './state';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StaticSymbol, CompileNgModuleMetadata } from '@angular/compiler';
import { DataSet } from 'vis';
import { DirectiveState } from './directive.state';
import { Node, Edge, Metadata, getId, Direction, SymbolTypes, isAngularSymbol, getProviderId, getProviderName } from '../../shared/data-format';
import { DirectiveSymbol, ModuleSymbol, ProjectSymbols, Symbol, ProviderSymbol, PipeSymbol } from 'ngast';
import { getDirectiveMetadata, getModuleMetadata, getProviderMetadata, getPipeMetadata } from '../formatters/model-formatter';
import { ProviderState } from './provider.state';
import { PipeState } from './pipe.state';

interface DataType {
  symbol: Symbol | ProviderSymbol | null;
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

  constructor(context: ProjectSymbols, protected module: ModuleSymbol) {
    super(getId(module.symbol), context);
  }

  getMetadata(id: string): Metadata | null {
    const data = this.symbols[id].data;
    if (!data) {
      return null;
    }
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
    const edges: Edge[] = [];
    const bootstrapComponents = this.module.getBootstrapComponents();
    if (bootstrapComponents.length) {
      bootstrapComponents.forEach(s => {
        const node = s.symbol;
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
      edges.push({ from: ModuleId, to: BootstrapId });
    }
    this.module.getDeclaredPipes().forEach(s => {
      const node = s.symbol;
      this._appendSet(DeclarationsId, s, nodes, SymbolTypes.Pipe, edges);
    });
    const declarations: (PipeSymbol | DirectiveSymbol)[] = this.module.getDeclaredDirectives();
    this.module.getDeclaredPipes().forEach(d => declarations.push(d));
    if (declarations.length) {
      declarations.forEach(s => {
        const node = s.symbol;
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
      edges.push({ from: ModuleId, to: DeclarationsId });
    }

    const exports: (PipeSymbol | DirectiveSymbol)[] = this.module.getExportedDirectives();
    this.module.getExportedPipes().forEach(d => exports.push(d));
    if (exports.length) {
      this.module.getExportedDirectives().forEach(d => {
        const node = d.symbol;
        this._appendSet(ExportsId, d, nodes, SymbolTypes.ComponentOrDirective, edges);
      });
      this.module.getExportedPipes().forEach(d => {
        const node = d.symbol;
        this._appendSet(ExportsId, d, nodes, SymbolTypes.Pipe, edges);
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
      edges.push({ from: ModuleId, to: ExportsId });
    }
    const providers = this.module.getProviders().reduce((prev: any, p) => {
      const id = getProviderId(p.getMetadata());
      prev[id] = p;
      return prev;
    }, {});
    if (Object.keys(providers).length) {
      edges.push({ from: ModuleId, to: ProvidersId });
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
    }
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

  private _appendSet(parentSet: string, node: Symbol | ProviderSymbol, nodes: NodeMap, symbolType: SymbolTypes, edges: Edge[]) {
    let id: string = '';
    let name = '';
    if (node instanceof ProviderSymbol) {
      id = getProviderId(node.getMetadata());
      name = getProviderName(node.getMetadata());
    } else {
      id = getId(node.symbol);
      name = node.symbol.name;
    }
    nodes[id] = {
      id,
      label: name,
      data: {
        symbol: node,
        metadata: null
      },
      type: {
        angular: node instanceof Symbol ? isAngularSymbol(node.symbol) : isAngularSymbol(node.getMetadata()),
        type: symbolType
      }
    };
    edges.push({
      from: parentSet,
      to: id
    });
  }

}
