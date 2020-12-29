import { State } from './state';
import { Metadata, VisualizationConfig, Graph, Layout } from '../../shared/data-format';
import { WorkspaceSymbols } from 'ngast';
import { ModuleTreeState } from './module-tree.state';
import { AppModuleState } from './app-module.state';
import { DirectiveState } from './directive.state';
import { InjectableState } from './injectable.state';
import { PipeState } from './pipe.state';

const CompositeStateID = '$$$composite-state$$$';
const Title = 'Application View';

export class AppState extends State {
  private states: State[] = [];

  constructor(context: WorkspaceSymbols, private _showLibs: boolean, private _showModules: boolean) {
    super(context, CompositeStateID);
    this.init();
  }

  get showLibs() {
    return this._showLibs;
  }

  get showModules() {
    return this._showModules;
  }

  getMetadata(id: string): Metadata | null {
    return this.states.reduce((c: Metadata | null, s: State) => {
      if (c !== null) return c;
      return s.getMetadata(id);
    }, null);
  }

  nextState(id: string) {
    return null;
  }

  getData(): VisualizationConfig<any> {
    const data: VisualizationConfig<any> = {
      layout: Layout.HierarchicalUDDirected,
      title: Title,
      graph: {
        nodes: [],
        edges: []
      }
    };
    const existingNodes = new Set();
    const existingEdges = new Set();
    this.states.forEach(s => {
      const { graph } = s.getData();
      graph.nodes.forEach(n => {
        if (!existingNodes.has(n.id) && this.showSymbol(n.id)) {
          data.graph.nodes.push(n);
          existingNodes.add(n.id);
        }
      });
      graph.edges.forEach(e => {
        const edge = `${e.from}->${e.to}`;
        if (!existingEdges.has(edge) && this.showSymbol(edge)) {
          data.graph.edges.push(e);
          existingEdges.add(edge);
        }
      });
    });
    return data;
  }

  private showSymbol(id: string|null) {
    if (this.showLibs) {
      return true;
    }
    return !id ? false : id.indexOf('node_modules') < 0;
  }

  private init() {
    // TODO: As for me it looks weird.
    this.context.getAllModules().forEach(m => {
      this.states.push(new ModuleTreeState(this.context, m));
    });
    if (!this.showModules) {
      this.context.getAllModules().forEach(m => {
        this.states.push(new AppModuleState(this.context, m));
      });
      this.context.getAllDirectives().forEach(d => {
        this.states.push(new DirectiveState(this.context, d, false));
      });
      this.context.getAllInjectable().forEach(p => {
        this.states.push(new InjectableState(this.context, p));
      });
      this.context.getAllPipes().forEach(p => {
        this.states.push(new PipeState(this.context, p));
      });
    }
  }
}
