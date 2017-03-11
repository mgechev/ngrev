import { State } from './state';
import { Project } from '../model/project-loader';
import { Module } from '../model/module';
import { StaticSymbol } from '@angular/compiler';
import { DataSet } from 'vis';

interface Node {
  label: string;
  symbol: any;
}

interface NodeMap {
  [id: string]: Node;
}

interface Edge {
  id: string;
  from: string;
  to: string;
}

export class ModuleState extends State {

  constructor(project: Project, protected module: Module) {
    super(project);
  }

  nextState() {
    return null;
  }

  getData() {
    const nodes = {
      exports: {
        label: 'Exports',
        symbol: null
      },
      entry: {
        label: 'Entry',
        symbol: null
      },
      providers: {
        label: 'Providers',
        symbol: null
      },
      module: {
        label: this.module.symbol.name,
        symbol: this.module
      }
    };
    const edges = [
      { id: 'exports-module', from: 'module', to: 'exports' },
      { id: 'entry-module', from: 'module', to: 'entry' },
      { id: 'providers-module', from: 'module', to: 'providers' },
    ];
    this.module.entryComponents.forEach(s => {
      const node = s.componentType as StaticSymbol;
      this._appendSet('entry', node, nodes, edges);
    });
    this.module.exportedDirectives.forEach(d => {
      const node = d.reference as StaticSymbol;
      this._appendSet('exports', node, nodes, edges);
    });
    const providers = this.module.providers.reduce((prev: any, p) => {
      const id = p.symbol.filePath + '#' + p.symbol.name;
      prev[id] = p;
      return prev;
    }, {});
    Object.keys(providers).forEach(key => {
      this._appendSet('providers', providers[key].symbol, nodes, edges);
    });
    return {
      nodes: new DataSet<any>(Object.keys(nodes).map((key: string) => {
        const node: any = Object.assign({}, nodes[key]);
        node.id = key;
        return node;
      })),
      edges: new DataSet<any>(edges)
    };
  }

  private _appendSet(set: string, node: StaticSymbol, nodes: NodeMap, edges: Edge[]) {
    const id = node.filePath + '#' + node.name;
    nodes[id] = {
      label: node.name,
      symbol: node
    };
    edges.push({
      id: set + '-' + id,
      from: set,
      to: id
    });
  }
}