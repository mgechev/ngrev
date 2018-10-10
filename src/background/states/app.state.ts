import { State } from './state';
import { Metadata, VisualizationConfig, Graph } from '../../shared/data-format';
import { ProjectSymbols } from 'ngast';
import { ModuleTreeState } from './module-tree.state';
import { AppModuleState } from './app-module.state';
import { DirectiveState } from './directive.state';
import { ProviderState } from './provider.state';
import { PipeState } from './pipe.state';

const CompositeStateID = '$$$composite-state$$$';

export class AppState extends State {
  private states: State[] = [];

  constructor(context: ProjectSymbols) {
    super(CompositeStateID, context);
    this.init();
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
      title: 'Application view',
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
        if (!existingNodes.has(n.id) && n.id.indexOf('node_modules') < 0) {
          data.graph.nodes.push(n);
          existingNodes.add(n.id);
        }
      });
      graph.edges.forEach(e => {
        const edge = `${e.from}->${e.to}`;
        if (!existingEdges.has(edge) && edge.indexOf('node_modules') < 0) {
          data.graph.edges.push(e);
          existingEdges.add(edge);
        }
      });
    });
    return data;
  }

  private init() {
    this.context.getModules().forEach(m => {
      this.states.push(new ModuleTreeState(this.context, m));
    });
    this.context.getModules().forEach(m => {
      this.states.push(new AppModuleState(this.context, m));
    });
    this.context.getDirectives().forEach(d => {
      this.states.push(new DirectiveState(this.context, d, false));
    });
    this.context.getProviders().forEach(p => {
      this.states.push(new ProviderState(this.context, p));
    });
    this.context.getPipes().forEach(p => {
      this.states.push(new PipeState(this.context, p));
    });
  }
}
