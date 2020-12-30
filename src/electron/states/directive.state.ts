import {
  DirectiveSymbol,
  WorkspaceSymbols,
  ComponentSymbol,
  InjectableSymbol,
} from "ngast";
import { State } from "./state";
import { TmplAstElement } from "@angular/compiler";
import {
  VisualizationConfig,
  Metadata,
  getId,
  Node,
  isAngularSymbol,
  SymbolTypes,
  Direction,
  Edge,
} from "../../shared/data-format";
import {
  getDirectiveMetadata,
  getElementMetadata,
} from "../formatters/model-formatter";
import { TemplateState } from "./template.state";

interface NodeMap {
  [id: string]: DirectiveSymbol | TmplAstElement;
}

const TemplateId = "template";
const DependenciesId = "dependencies";
const ViewProvidersId = "view-providers";
const ProvidersId = "providers";

export class DirectiveState extends State {
  private symbols: NodeMap = {};

  constructor(
    context: WorkspaceSymbols,
    protected directive: DirectiveSymbol | ComponentSymbol,
    private showControl = true
  ) {
    super(getId(directive), context);
  }

  getMetadata(id: string): Metadata | null {
    const s = this.symbols[id];
    console.log(Object.keys(this.symbols));
    if (s) {
      if (s instanceof TmplAstElement) {
        return getElementMetadata(s);
      } else if (s instanceof DirectiveSymbol) {
        return getDirectiveMetadata(s);
      }
    }
    return null;
  }

  nextState(id: string) {
    if (id === TemplateId && this.directive instanceof ComponentSymbol) {
      return new TemplateState(this.context, this.directive);
    }
    if (id === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[id];
    if (symbol instanceof DirectiveSymbol) {
      return new DirectiveState(this.context, symbol);
    } else {
      return null;
    }
  }

  getData(): VisualizationConfig<any> {
    const s = this.directive;
    const nodeId = getId(s);
    const nodes: Node<DirectiveSymbol | ComponentSymbol>[] = [
      {
        id: nodeId,
        label: s.name,
        data: this.directive,
        type: {
          type: SymbolTypes.Component,
          angular: isAngularSymbol(s),
        },
      },
    ];
    const edges: Edge[] = [];
    if (this.showControl) {
      if (this.directive instanceof ComponentSymbol) {
        nodes.push({
          id: TemplateId,
          label: "Template",
          type: {
            type: SymbolTypes.Meta,
            angular: false,
          },
        });
        edges.push({
          from: nodeId,
          to: TemplateId,
        });
      }
      const addedSymbols: { [key: string]: boolean } = {};
      this.addProviderNodes(
        nodes,
        edges,
        addedSymbols,
        "Dependencies",
        DependenciesId,
        this.directive.getDependencies() as InjectableSymbol[]
      );
      this.addProviderNodes(
        nodes,
        edges,
        addedSymbols,
        "Providers",
        ProvidersId,
        this.directive.getProviders() as InjectableSymbol[]
      );
      this.addProviderNodes(
        nodes,
        edges,
        addedSymbols,
        "View Providers",
        ViewProvidersId,
        this.directive.getProviders() as InjectableSymbol[]
      );
    }
    return {
      title: this.directive.name,
      graph: {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
        })),
        edges,
      },
    };
  }

  private addProviderNodes(
    nodes: Node<any>[],
    edges: any[],
    addedSymbols: { [key: string]: boolean },
    rootLabel: string,
    rootId: string,
    providers: InjectableSymbol[]
  ) {
    if (providers.length > 0) {
      nodes.push({
        id: rootId,
        label: rootLabel,
        type: {
          type: SymbolTypes.Meta,
          angular: false,
        },
      });
      edges.push({
        from: getId(this.directive),
        to: rootId,
      });
    }
    const existing = {};
    const directiveId = getId(this.directive);
    providers.forEach((p) => {
      const id = getId(p);
      if (id === null) {
        return;
      }
      existing[id] = (existing[id] || 0) + 1;
      const node: Node<any> = {
        id,
        data: p,
        label: p.name,
        type: {
          angular: isAngularSymbol(p),
          type: SymbolTypes.Provider,
        },
      };
      // Handle circular references
      if (!addedSymbols[id]) {
        nodes.push(node);
        addedSymbols[id] = true;
      }
    });
    if (existing[directiveId]) {
      edges.push({
        from: rootId,
        to: directiveId,
        direction: Direction.To,
      });
    }
    Object.keys(existing).forEach((key: string) => {
      edges.push({
        from: rootId,
        to: key,
        direction: Direction.To,
      });
    });
    nodes.forEach((n) => {
      this.symbols[n.id] = n.data;
    });
  }
}
