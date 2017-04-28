import { State } from './state';
import { StaticSymbol, CompileNgModuleMetadata } from '@angular/compiler';
import { DataSet } from 'vis';
import { ModuleState } from './module.state';
import { VisualizationConfig, Layout, Node, Metadata, Graph, getId, Direction, isAngularSymbol, SymbolTypes, SymbolType } from '../../shared/data-format';
import { ProjectSymbols, ModuleSymbol } from 'ngast';
import { getModuleMetadata } from '../formatters/model-formatter';
import { Trie } from '../utils/trie';
import { isAbsolute, normalize, join, sep } from 'path';

interface NodeMap {
  [id: string]: ModuleSymbol;
}

const ModuleIndex = new Trie<ModuleSymbol>((str: string) => str.split(/\/|#/));

export class ModuleTreeState extends State {
  private data: VisualizationConfig<ModuleSymbol>;
  private symbols: NodeMap = {};

  // Based on the summary find all lazy loaded modules (look for `ROUTES` and `loadChildren`)
  // Based on the content of the `loadChildren` property and the path for the current module
  // find the symbols corresponding to the lazy-loaded modules and add them to the graph.
  constructor(private rootContext: ProjectSymbols, private module: ModuleSymbol) {
    super(getId(module.symbol), rootContext);

    if (!ModuleIndex.size) {
      rootContext.getModules()
        .forEach(m => {
          ModuleIndex.insert(getId(m.symbol), m);
        });
    }

    const graph = this._getModuleGraph(module);
    graph.nodes.forEach(n => {
      if (n.data) {
        this.symbols[n.id] = n.data;
      }
    });
    this.data = {
      graph,
      layout: Layout.Regular
    }
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
      })).concat(lazyModules.map(m => {
        return {
          id: getId(m.symbol),
          label: m.symbol.name,
          data: m,
          type: {
            angular: isAngularSymbol(module.symbol),
            type: SymbolTypes.LazyModule
          }
        };
      }));
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
    }
  }

  private _loadChildrenToSymbolId(moduleUri: string) {
    const currentPath = this.module.symbol.filePath;
    const moduleUriParts = moduleUri.split('#');
    if (!/\.js|\.ts/.test(moduleUriParts[0])) {
      moduleUriParts[0] = moduleUriParts[0] + '.ts';
    }
    if (!isAbsolute(moduleUriParts[0])) {
      const parent = currentPath.split(sep);
      parent.pop();
      moduleUriParts[0] = normalize(join(parent.join(sep), moduleUriParts[0]));
    }
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
          declarations
            .filter(d => !!d.loadChildren)
            .map(d => this._loadChildrenToSymbolId(d.loadChildren))
            .map(id => ModuleIndex.get(id))
            .forEach(d => d && result.push(d));
          return result;
        }
      }
    }
  }
}
