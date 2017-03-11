import { State } from './state';
import { Project } from '../model/project-loader';
import { StaticSymbol, CompileNgModuleMetadata } from '@angular/compiler';
import { DataSet } from 'vis';
import { DirectiveState } from './directive.state';
import { Node, Edge, Metadata } from '../formatters/data-format';
import { DirectiveSymbol, ModuleSymbol, ContextSymbols } from 'ngast';

interface DataType {
  symbolType: SymbolType,
  symbol: StaticSymbol;
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
    const symbol = this.symbols[nodeId].data;
    if (!symbol) {
      return null;
    }
    switch (symbol.symbolType) {
      case SymbolType.Directive:
      if (this.module) {
        const directives = this.context.getDirectives();
        return new DirectiveState(this.context,
          directives
            .filter(d => d.symbol.filePath === symbol.symbol.filePath
            && d.symbol.name === symbol.symbol.name).pop());
      }
      break;
    }
    return null;
  }

  getData() {
    const nodes: NodeMap = {
      exports: {
        id: 'exports',
        label: 'Exports',
        data: {
          symbol: null,
          symbolType: SymbolType.Meta,
          metadata: null
        }
      },
      entry: {
        id: 'entry',
        label: 'Entry',
        data: {
          symbol: null,
          symbolType: SymbolType.Meta,
          metadata: null
        }
      },
      providers: {
        id: 'providers',
        label: 'Providers',
        data: {
          symbol: null,
          symbolType: SymbolType.Meta,
          metadata: null
        }
      },
      module: {
        id: 'module',
        label: this.module.symbol.name,
        data: {
          symbol: this.module.symbol,
          symbolType: SymbolType.Meta,
          metadata: null
        }
      }
    };
    const edges = [
      { from: 'module', to: 'exports' },
      { from: 'module', to: 'entry' },
      { from: 'module', to: 'providers' },
    ];
    this.module.getBootstrapComponents().forEach(s => {
      const node = s.symbol;
      this._appendSet('entry', node, nodes, SymbolType.Directive, edges);
    });
    this.module.getExportedDirectives().forEach(d => {
      const node = d.symbol;
      this._appendSet('exports', node, nodes, SymbolType.Provider, edges);
    });
    // const providers = this.module.get.reduce((prev: any, p) => {
    //   const id = p.symbol.filePath + '#' + p.symbol.name;
    //   prev[id] = p;
    //   return prev;
    // }, {});
    // Object.keys(providers).forEach(key => {
    //   this._appendSet('providers', providers[key].symbol, nodes, SymbolType.Provider, edges);
    // });
    this.symbols = nodes;
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

  private _appendSet(set: string, node: StaticSymbol, nodes: NodeMap, symbolType: SymbolType, edges: Edge[]) {
    const id = node.filePath + '#' + node.name;
    nodes[id] = {
      id,
      label: node.name,
      data: {
        symbol: node,
        symbolType,
        metadata: this._getModuleMetadata(node)
      }
    };
    edges.push({
      from: set,
      to: id
    });
  }

  private _getModuleMetadata(node: StaticSymbol): Metadata {
    return [
      { key: 'Name', value: node.name },
      { key: 'Members', value: node.members.join('\n') }
    ];
  }
}