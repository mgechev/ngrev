import { State } from './state';
import { DirectiveState } from './directive.state';
import {
  Node,
  Edge,
  Metadata,
  getId,
  SymbolTypes,
  isAngularSymbol,
  getProviderId,
  getProviderName,
  VisualizationConfig
} from '../../shared/data-format';
import { DirectiveSymbol, ModuleSymbol, ProjectSymbols, Symbol, ProviderSymbol, PipeSymbol } from 'ngast';
import { getDirectiveMetadata, getProviderMetadata, getPipeMetadata } from '../formatters/model-formatter';
import { InjectableState } from './injectable.state';
import { PipeState } from './pipe.state';

interface DataType {
  symbol: Symbol | ProviderSymbol | null;
  metadata: any;
}

interface NodeMap {
  [id: string]: Node<DataType>;
}

export class AppModuleState extends State {
  private symbols: NodeMap;

  constructor(context: ProjectSymbols, protected module: ModuleSymbol) {
    super(context, getId(module.symbol));
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
      return new InjectableState(this.context, data.symbol);
    } else if (data.symbol instanceof PipeSymbol) {
      return new PipeState(this.context, data.symbol);
    }
    return null;
  }

  getData(): VisualizationConfig<any> {
    const currentModuleId = getId(this.module.symbol);
    const nodes: NodeMap = {
      [currentModuleId]: {
        id: currentModuleId,
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
        this._appendSet(currentModuleId, s, nodes, SymbolTypes.ComponentOrDirective, edges);
      });
    }
    this.module.getDeclaredPipes().forEach(s => {
      this._appendSet(currentModuleId, s, nodes, SymbolTypes.Pipe, edges);
    });
    const declarations: (PipeSymbol | DirectiveSymbol)[] = this.module.getDeclaredDirectives();
    this.module.getDeclaredPipes().forEach(d => declarations.push(d));
    if (declarations.length) {
      declarations.forEach(s => {
        const node = s.symbol;
        if (node instanceof PipeSymbol) {
          this._appendSet(currentModuleId, s, nodes, SymbolTypes.Pipe, edges);
        } else {
          this._appendSet(currentModuleId, s, nodes, SymbolTypes.ComponentOrDirective, edges);
        }
      });
    }

    const exports: (PipeSymbol | DirectiveSymbol)[] = this.module.getExportedDirectives();
    this.module.getExportedPipes().forEach(d => exports.push(d));
    if (exports.length) {
      this.module.getExportedDirectives().forEach(d => {
        this._appendSet(currentModuleId, d, nodes, SymbolTypes.ComponentOrDirective, edges);
      });
      this.module.getExportedPipes().forEach(d => {
        this._appendSet(currentModuleId, d, nodes, SymbolTypes.Pipe, edges);
      });
    }
    const providers = this.module.getProviders().reduce((prev: any, p) => {
      const id = getProviderId(p.getMetadata());
      prev[id] = p;
      return prev;
    }, {});
    Object.keys(providers).forEach(key => {
      this._appendSet(currentModuleId, providers[key], nodes, SymbolTypes.Injectable, edges);
    });
    this.symbols = nodes;
    return {
      title: this.module.symbol.name,
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
    node: Symbol | ProviderSymbol,
    nodes: NodeMap,
    symbolType: SymbolTypes,
    edges: Edge[]
  ) {
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
