import { State } from './state';
import { Project } from '../model/project-loader';
import { Module } from '../model/module';
import { StaticSymbol } from '@angular/compiler';
import { DataSet } from 'vis';
import { DirectiveState } from './directive.state';
import { Node } from '../formatters/data-format';

interface DataType {
  symbolType: SymbolType,
  symbol: StaticSymbol;
}

interface NodeMap {
  [id: string]: Node<DataType>;
}

interface Edge {
  id: string;
  from: string;
  to: string;
}

enum SymbolType {
  Directive,
  Provider,
  Meta
}

export class ModuleState extends State {

  private symbols: NodeMap;

  constructor(project: Project, protected module: Module) {
    super(project);
  }

  nextState(nodeId: string) {
    const symbol = this.symbols[nodeId].data;
    if (!symbol) {
      return null;
    }
    switch (symbol.symbolType) {
      case SymbolType.Directive:
      if (this.module.context) {
        const directives = this.module.context.getDirectives();
        return new DirectiveState(this.project,
          directives.filter(d => d.symbol.filePath === symbol.symbol.filePath
            && d.symbol.name === symbol.symbol.name).pop(), this.module.context);
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
          symbolType: SymbolType.Meta
        }
      },
      entry: {
        id: 'entry',
        label: 'Entry',
        data: {
          symbol: null,
          symbolType: SymbolType.Meta
        }
      },
      providers: {
        id: 'providers',
        label: 'Providers',
        data: {
          symbol: null,
          symbolType: SymbolType.Meta
        }
      },
      module: {
        id: 'module',
        label: this.module.symbol.name,
        data: {
          symbol: this.module.symbol,
          symbolType: SymbolType.Meta
        }
      }
    };
    const edges = [
      { id: 'exports-module', from: 'module', to: 'exports' },
      { id: 'entry-module', from: 'module', to: 'entry' },
      { id: 'providers-module', from: 'module', to: 'providers' },
    ];
    this.module.entryComponents.forEach(s => {
      const node = s.componentType as StaticSymbol;
      this._appendSet('entry', node, nodes, SymbolType.Directive, edges);
    });
    this.module.exportedDirectives.forEach(d => {
      const node = d.reference as StaticSymbol;
      this._appendSet('exports', node, nodes, SymbolType.Provider, edges);
    });
    const providers = this.module.providers.reduce((prev: any, p) => {
      const id = p.symbol.filePath + '#' + p.symbol.name;
      prev[id] = p;
      return prev;
    }, {});
    Object.keys(providers).forEach(key => {
      this._appendSet('providers', providers[key].symbol, nodes, SymbolType.Provider, edges);
    });
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
        symbolType
      }
    };
    edges.push({
      id: set + '-' + id,
      from: set,
      to: id
    });
  }
}