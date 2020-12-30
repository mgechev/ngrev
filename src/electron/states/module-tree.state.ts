import { isAbsolute, normalize, join, sep } from 'path';

import { State } from './state';
import { ModuleState } from './module.state';
import {
  VisualizationConfig,
  Layout,
  Node,
  Metadata,
  Graph,
  getId,
  Direction,
  isAngularSymbol,
  SymbolTypes
} from '../../shared/data-format';
import { getModuleMetadata } from '../formatters/model-formatter';
import { Trie } from '../utils/trie';
import { NgModuleSymbol, WorkspaceSymbols } from 'ngast';

interface NodeMap {
  [id: string]: NgModuleSymbol;
}

const ModuleIndex = new Trie<NgModuleSymbol>((str: string) => str.split(/\/|#/));

const formatModuleGraph = (data: Graph<NgModuleSymbol>) => {
  return {
    edges: data.edges,
    nodes: data.nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.label
    }))
  };
};

export class ModuleTreeState extends State {
  private data: VisualizationConfig<NgModuleSymbol>;
  private symbols: NodeMap = {};

  constructor(private rootContext: WorkspaceSymbols, private module: NgModuleSymbol) {
    super(getId(module), rootContext);

    if (!ModuleIndex.size) {
      this.rootContext.getAllModules().forEach(m => ModuleIndex.insert(getId(m), m));
    }

    const graph = this._getModuleGraph(module);
    graph.nodes.forEach(n => {
      if (n.data) {
        this.symbols[n.id] = n.data;
      }
    });
    this.data = {
      title: `${module.name}'s imports & exports`,
      graph: formatModuleGraph(graph),
      layout: Layout.Regular
    };
  }

  getMetadata(id: string): Metadata | null {
    const m = this.symbols[id];
    if (m) {
      return getModuleMetadata(m);
    }
    return null;
  }

  getData(): VisualizationConfig<NgModuleSymbol> {
    return this.data;
  }

  // Switch to binary search if gets too slow.
  nextState(id: string): State {
    const module = this.symbols[id];
    if (module === this.module) {
      return new ModuleState(this.context, module);
    } else {
      return new ModuleTreeState(this.context, module);
    }
  }

  destroy(): void {
    ModuleIndex.clear();
  }

  private _getModuleGraph(module: NgModuleSymbol): Graph<NgModuleSymbol> {
    const imports = module.getImports();
    const nodes: Node<NgModuleSymbol>[] = [
      {
        id: getId(module),
        label: module.name,
        data: module,
        type: {
          angular: isAngularSymbol(module),
          type: SymbolTypes.Module
        }
      }
    ]
      .concat(
        imports.map(m => {
          return {
            id: getId(m),
            label: m.name,
            data: m,
            type: {
              angular: isAngularSymbol(module),
              type: SymbolTypes.Module
            }
          };
        })
      );
    const edges = nodes.slice(1, nodes.length).map((n) => {
      return {
        from: nodes[0].id,
        to: n.id,
        direction: Direction.To,
        dashes: n.type && n.type.type === SymbolTypes.LazyModule
      };
    });
    return {
      nodes,
      edges
    };
  }
}
