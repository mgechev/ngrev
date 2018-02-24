import { StaticSymbol, CompileNgModuleMetadata } from '@angular/compiler';
import { ProjectSymbols, ModuleSymbol } from 'ngast';
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
  SymbolTypes,
  SymbolType
} from '../../shared/data-format';
import { getModuleMetadata } from '../formatters/model-formatter';
import { Trie } from '../utils/trie';

interface NodeMap {
  [id: string]: ModuleSymbol;
}

const ModuleIndex = new Trie<ModuleSymbol>((str: string) => str.split(/\/|#/));

const formatModuleGraph = (data: Graph<ModuleSymbol>) => {
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
  private data: VisualizationConfig<ModuleSymbol>;
  private symbols: NodeMap = {};

  // Based on the summary find all lazy loaded modules (look for `ROUTES` and `loadChildren`)
  // Based on the content of the `loadChildren` property and the path for the current module
  // find the symbols corresponding to the lazy-loaded modules and add them to the graph.
  constructor(private rootContext: ProjectSymbols, private module: ModuleSymbol) {
    super(getId(module.symbol), rootContext);

    if (!ModuleIndex.size) {
      rootContext.getModules().forEach(m => ModuleIndex.insert(getId(m.symbol), m));
    }

    const graph = this._getModuleGraph(module);
    graph.nodes.forEach(n => {
      if (n.data) {
        this.symbols[n.id] = n.data;
      }
    });
    this.data = {
      title: `${module.symbol.name}'s imports & exports`,
      graph: formatModuleGraph(graph),
      layout: Layout.Regular
    };
  }

  getMetadata(id: string): Metadata | null {
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

  private _getModuleGraph(module: ModuleSymbol): Graph<ModuleSymbol> {
    const imports = module.getImportedModules();
    const exports = module.getExportedModules();
    const lazyModules = this._getLazyModules();
    const nodes: Node<ModuleSymbol>[] = [
      {
        id: getId(module.symbol),
        label: module.symbol.name,
        data: module,
        type: {
          angular: isAngularSymbol(module.symbol),
          type: SymbolTypes.Module
        }
      }
    ]
      .concat(
        imports.map(m => {
          return {
            id: getId(m.symbol),
            label: m.symbol.name,
            data: m,
            type: {
              angular: isAngularSymbol(module.symbol),
              type: SymbolTypes.Module
            }
          };
        })
      )
      .concat(
        lazyModules.map(m => {
          return {
            id: getId(m.symbol),
            label: m.symbol.name,
            data: m,
            type: {
              angular: isAngularSymbol(module.symbol),
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
    const currentPath = this.module.symbol.filePath;
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
      filePath: moduleUriParts[0]
    });
  }

  private _getLazyModules(): ModuleSymbol[] {
    const summary = this.module.getModuleSummary();
    if (!summary) {
      return [];
    } else {
      const routes = summary.providers.filter(s => {
        return s.provider.token.identifier && s.provider.token.identifier.reference.name === 'ROUTES';
      });
      if (!routes) {
        return [];
      }
      const currentDeclarations = routes.pop();
      if (!currentDeclarations) {
        return [];
      } else {
        const declarations = currentDeclarations.provider.useValue as any[];
        if (!declarations) {
          return [];
        } else {
          const result: ModuleSymbol[] = [];
          _collectLoadChildren(declarations)
            .map(loadChildren => this._loadChildrenToSymbolId(loadChildren))
            .map(id => ModuleIndex.get(id))
            .forEach(d => {
              // Add to result array only if there is not
              // This is because duplicities stop drawing related modules
              if (d && result.indexOf(d) === -1) result.push(d);
            });
          return result;
        }
      }
    }
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
