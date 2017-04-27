import { State } from './state';
import { StaticSymbol, CompileNgModuleMetadata } from '@angular/compiler';
import { DataSet } from 'vis';
import { ModuleState } from './module.state';
import { VisualizationConfig, Layout, Node, Metadata, Graph, getId, Direction, isAngularSymbol, SymbolTypes } from '../../shared/data-format';
import { ProjectSymbols, ModuleSymbol } from 'ngast';
import { getModuleMetadata } from '../formatters/model-formatter';

interface NodeMap {
  [id: string]: ModuleSymbol;
}

export class ModuleTreeState extends State {
  private data: VisualizationConfig<ModuleSymbol>;
  private symbols: NodeMap = {};

  // Based on the summary find all lazy loaded modules (look for `ROUTES` and `loadChildren`)
  // Based on the content of the `loadChildren` property and the path for the current module
  // find the symbols corresponding to the lazy-loaded modules and add them to the graph.
  constructor(private rootContext: ProjectSymbols, private module: ModuleSymbol) {
    super(getId(module.symbol), rootContext);
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
      return getModuleMetadata(m.symbol);
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

  private _getModuleGraph(module: ModuleSymbol): Graph<ModuleSymbol> {
    const imports = module.getImportedModules();
    const exports = module.getExportedModules();
    const nodes: Node<ModuleSymbol>[] = [{
        id: getId(module.symbol),
        label: module.symbol.name,
        data: module,
        type: {
          angular: isAngularSymbol(module.symbol),
          type: SymbolTypes.Module
        }
      }].concat(imports.map(m => {
        return {
          id: getId(m.symbol),
          label: m.symbol.name,
          data: m,
          type: {
            angular: isAngularSymbol(module.symbol),
            type: SymbolTypes.Module
          }
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
