import { StaticSymbol, CompileNgModuleMetadata } from '@angular/compiler';
import { DataSet } from 'vis';
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

  // Based on the summary find all lazy loaded modules (look for `ROUTES` and `loadChildren`)
  // Based on the content of the `loadChildren` property and the path for the current module
  // find the symbols corresponding to the lazy-loaded modules and add them to the graph.
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

  destroy() {
    ModuleIndex.clear();
  }

  private _getModuleGraph(module: NgModuleSymbol): Graph<NgModuleSymbol> {
    const imports = module.getImports();
    const exports = module.getExports();
    const lazyModules = this._getLazyModules();
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
      )
      .concat(
        lazyModules.map(m => {
          return {
            id: getId(m),
            label: m.name,
            data: m,
            type: {
              angular: isAngularSymbol(module),
              type: SymbolTypes.LazyModule
            }
          };
        })
      );
    const edges = nodes.slice(1, nodes.length).map((n, idx) => {
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

  private _loadChildrenToSymbolId(moduleUri: string) {
    const currentPath = this.module.path;
    const moduleUriParts = moduleUri.split('#');
    if (!/\.js|\.ts/.test(moduleUriParts[0])) {
      moduleUriParts[0] = moduleUriParts[0] + '.ts';
    }
    if (!isAbsolute(moduleUriParts[0])) {
      const parentParts = currentPath.split('/');
      parentParts.pop();
      const childParts = moduleUriParts[0].split('/');
      let longestMatch = 0;
      console.log(moduleUriParts[0], currentPath);
      const findLongestPrefix = (a: string[], b: string[], astart: number, bstart: number) => {
        const max = Math.min(a.length - astart, b.length - bstart);
        let matchLen = 0;
        for (let i = 0; i < max; i += 1) {
          if (a[i + astart] === b[i + bstart]) {
            matchLen += 1;
          } else {
            return matchLen;
          }
        }
        return matchLen;
      };
      for (let i = 0; i < parentParts.length; i += 1) {
        for (let j = 0; j < childParts.length; j += 1) {
          const currentPrefix = findLongestPrefix(parentParts, childParts, i, j);
          if (currentPrefix > longestMatch) {
            longestMatch = currentPrefix;
          }
        }
      }
      let parentPath = parentParts.slice(0, parentParts.length - longestMatch).join('/');
      moduleUriParts[0] = normalize(join(parentPath, moduleUriParts[0]))
        .split(sep)
        .join('/');
    }
    console.log(moduleUriParts[0]);
    return getId({
      name: moduleUriParts[1],
      path: moduleUriParts[0]
    });
  }

  private _getLazyModules(): NgModuleSymbol[] {
    return [];
    // const summary = this.module.getModuleSummary();
    // if (!summary) {
    //   return [];
    // } else {
    //   const routes = summary.providers.filter(s => {
    //     return s.provider.token.identifier && s.provider.token.identifier.reference.name === 'ROUTES';
    //   });
    //   if (!routes) {
    //     return [];
    //   }
    //   const currentDeclarations = routes.pop();
    //   if (!currentDeclarations) {
    //     return [];
    //   } else {
    //     const declarations = currentDeclarations.provider.useValue as any[];
    //     if (!declarations) {
    //       return [];
    //     } else {
    //       const result: NgModuleSymbol[] = [];
    //       _collectLoadChildren(declarations)
    //         .map(loadChildren => this._loadChildrenToSymbolId(loadChildren))
    //         .map(id => ModuleIndex.get(id))
    //         .forEach(d => {
    //           // Add to result array only if there is not
    //           // This is because duplicities stop drawing related modules
    //           if (d && result.indexOf(d) === -1) result.push(d);
    //         });
    //       return result;
    //     }
    //   }
    // }
  }
}

function _collectLoadChildren(routes: any[]): string[] {
  return routes.reduce((m, r) => {
    if (r.loadChildren && typeof r.loadChildren === 'string') {
      return m.concat(r.loadChildren);
    } else if (Array.isArray(r)) {
      return m.concat(_collectLoadChildren(r));
    } else if (r.children) {
      return m.concat(_collectLoadChildren(r.children));
    } else {
      return m;
    }
  }, []);
}
