import {
  ComponentSymbol,
  DirectiveSymbol,
  InjectableSymbol,
  NgModuleSymbol,
  PipeSymbol,
  WorkspaceSymbols
} from 'ngast';
import { State } from './state';
import { Metadata, VisualizationConfig, Layout, Node, Edge } from '../../shared/data-format';
import { ModuleTreeState } from './module-tree.state';
import { AppModuleState } from './app-module.state';
import { DirectiveState } from './directive.state';
import { ProviderState } from './provider.state';
import { PipeState } from './pipe.state';

const CompositeStateID = '$$$composite-state$$$';
const Title = 'Application View';

export class AppState extends State {
  private states: State[] = [];

  constructor(context: WorkspaceSymbols, private _showLibs: boolean, private _showModules: boolean) {
    super(CompositeStateID, context);
    this.init();
  }

  get showLibs(): boolean {
    return this._showLibs;
  }

  get showModules(): boolean {
    return this._showModules;
  }

  getMetadata(id: string): Metadata | null {
    return this.states.reduce((c: Metadata | null, s: State) => {
      if (c !== null) return c;
      return s.getMetadata(id);
    }, null);
  }

  nextState(): null {
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
    this.states.forEach((state: State) => {
      const { graph } = state.getData();
      graph.nodes.forEach((node: Node<any>) => {
        if (!existingNodes.has(node.id) && this.showSymbol(node.id)) {
          data.graph.nodes.push(node);
          existingNodes.add(node.id);
        }
      });
      graph.edges.forEach((edge: Edge) => {
        const edgeKey = `${edge.from}->${edge.to}`;
        if (!existingEdges.has(edgeKey) && this.showSymbol(edgeKey)) {
          data.graph.edges.push(edge);
          existingEdges.add(edgeKey);
        }
      });
    });
    return data;
  }

  private showSymbol(id: string): boolean {
    if (this.showLibs) {
      return true;
    }
    return id.indexOf('node_modules') < 0;
  }

  private init(): void {
    this.context.getAllModules().forEach((module: NgModuleSymbol) => {
      this.states.push(new ModuleTreeState(this.context, module));
    });
    if (!this.showModules) {
      this.context.getAllModules().forEach((module: NgModuleSymbol) => {
        this.states.push(new AppModuleState(this.context, module));
      });
      this.context.getAllDirectives().forEach((directive: DirectiveSymbol) => {
        this.states.push(new DirectiveState(this.context, directive, false));
      });
      this.context.getAllComponents().forEach((component: ComponentSymbol) => {
        this.states.push(new DirectiveState(this.context, component, false));
      });
      this.context.getAllInjectable().forEach((injectable: InjectableSymbol) => {
        this.states.push(new ProviderState(this.context, injectable));
      });
      this.context.getAllPipes().forEach((pipe: PipeSymbol) => {
        this.states.push(new PipeState(this.context, pipe));
      });
    }
  }
}
