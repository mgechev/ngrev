import { State } from './state';
import { Project } from '../model/project-loader';
import { Module } from '../model/module';
import { StaticSymbol } from '@angular/compiler';
import { DataSet } from 'vis';
import { DirectiveState } from './directive.state';

interface Node {
  label: string;
  symbol: any;
  symbolType: SymbolType
}

interface NodeMap {
  [id: string]: Node;
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
    const symbol = this.symbols[nodeId];
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
    const nodes = {
      exports: {
        label: 'Exports',
        symbol: null,
        symbolType: SymbolType.Meta
      },
      entry: {
        label: 'Entry',
        symbol: null,
        symbolType: SymbolType.Meta
      },
      providers: {
        label: 'Providers',
        symbol: null,
        symbolType: SymbolType.Meta
      },
      module: {
        label: this.module.symbol.name,
        symbol: this.module,
        symbolType: SymbolType.Meta
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
      nodes: new DataSet<any>(Object.keys(nodes).map((key: string) => {
        const node: any = Object.assign({}, nodes[key]);
        node.id = key;
        return node;
      })),
      edges: new DataSet<any>(edges)
    };
  }

  private _appendSet(set: string, node: StaticSymbol, nodes: NodeMap, symbolType: SymbolType, edges: Edge[]) {
    const id = node.filePath + '#' + node.name;
    nodes[id] = {
      label: node.name,
      symbol: node,
      symbolType
    };
    edges.push({
      id: set + '-' + id,
      from: set,
      to: id
    });
  }
}