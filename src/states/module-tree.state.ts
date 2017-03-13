import { State } from './state';
import { StaticSymbol, CompileNgModuleMetadata } from '@angular/compiler';
import { DataSet } from 'vis';
import { ModuleState } from './module.state';
import { VisualizationConfig, Layout, Node, Metadata, Graph, getId, Direction } from '../formatters/data-format';
import { ContextSymbols, ModuleSymbol } from 'ngast';

interface NodeMap {
  [id: string]: ModuleSymbol;
}

export class ModuleTreeState extends State {
  private data: VisualizationConfig<ModuleSymbol>;
  private symbols: NodeMap = {};

  constructor(private rootContext: ContextSymbols, private module: ModuleSymbol) {
    super(rootContext);
    const graph = this._getModuleGraph(module);
    graph.nodes.forEach(n => {
      this.symbols[n.id] = n.data;
    });
    this.data = {
      graph,
      layout: Layout.Regular
    }
  }

  getMetadata(id: string): Metadata {
    const m = this.symbols[id];
    if (m && m.symbol) {
      return this._getModuleMetadata(m.symbol);
    }
    return null;
  }

  getData(): VisualizationConfig<ModuleSymbol> {
    return this.data;
  }

  // Switch to binary search if gets too slow.
  nextState(id: string) {
    const module = this.symbols[id];
    if (module === this.module) {
      return new ModuleState(this.context, module);
    } else {
      return new ModuleTreeState(this.context, module);
    }
  }

  private _getModuleMetadata(node: StaticSymbol): Metadata {
    return [
      { key: 'Name', value: node.name },
      { key: 'Members', value: node.members.join('\n') }
    ];
  }

  private _getModuleGraph(module: ModuleSymbol): Graph<ModuleSymbol> {
    const imports = module.getImportedModules();
    const exports = module.getExportedModules();
    const nodes: Node<ModuleSymbol>[] = [{
        id: getId(module.symbol),
        label: module.symbol.name,
        data: module
      }].concat(imports.map(m => {
        return {
          id: getId(m.symbol),
          label: m.symbol.name,
          data: m,
        };
      }));
    const edges = nodes.slice(1, nodes.length).map((n, idx) => {
      return {
        from: nodes[0].id,
        to: n.id,
        direction: Direction.To
      };
    });
    return {
      nodes,
      edges
    }
  }
}
