import {
  AnnotationNames,
  ComponentSymbol,
  DirectiveSymbol,
  Symbol,
  WorkspaceSymbols,
} from "ngast";
import { State } from "./state";
import { ElementAst, DirectiveAst } from "@angular/compiler";
import {
  VisualizationConfig,
  Metadata,
  getId,
  Node,
  SymbolTypes,
} from "../../shared/data-format";
import {
  getDirectiveMetadata,
  getElementMetadata,
} from "../formatters/model-formatter";
import { DirectiveState } from "./directive.state";

interface NodeMap {
  [id: string]: ComponentSymbol | DirectiveSymbol | ElementAst;
}

const TemplateId = "template";

export class TemplateState extends State {
  private symbols: NodeMap = {};

  constructor(context: WorkspaceSymbols, protected directive: ComponentSymbol) {
    super(getId(directive), context);
  }

  getMetadata(id: string): Metadata | null {
    const s = this.symbols[id];
    if (s) {
      if (s instanceof ElementAst) {
        return getElementMetadata(s);
      } else if (s instanceof ComponentSymbol) {
        return getDirectiveMetadata(s);
      }
    }
    return null;
  }

  nextState(id: string) {
    if (id === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[id];
    if (!symbol) {
      return null;
    }
    if (symbol instanceof ComponentSymbol) {
      return new DirectiveState(this.context, symbol);
    } else {
      return null;
    }
  }

  getData(): VisualizationConfig<any> {
    const label = `${this.directive.name}'s Template`;
    const nodes: Node<ComponentSymbol>[] = [
      {
        id: TemplateId,
        label,
        type: {
          type: SymbolTypes.Meta,
          angular: false,
        },
      },
    ];
    const edges = [];
    this.addTemplateNodes(nodes, edges);
    return {
      title: label,
      graph: {
        nodes,
        edges,
      },
    };
  }

  private addTemplateNodes(
    resNodes: Node<ComponentSymbol | ElementAst>[],
    edges: any[]
  ) {
    const rootNodes = this.directive.getTemplateAst();
    let currentNode = 0;
    const dirMap = (this.context.getAllDirectives() as Symbol<
      AnnotationNames
    >[])
      .concat(this.context.getAllComponents())
      .reduce((p, s) => {
        p[getId(s)] = s;
        return p;
      }, {} as any);
    const addNodes = (nodes: ElementAst[], parentNodeId: string) => {
      nodes.forEach((n) => {
        currentNode += 1;
        const nodeId = "el-" + currentNode;
        edges.push({
          from: parentNodeId,
          to: nodeId,
        });
        const node = {
          id: nodeId,
          label: n.name,
          data: n as ElementAst,
          type: {
            angular: false,
            type: n.directives.length
              ? SymbolTypes.HtmlElementWithDirective
              : SymbolTypes.HtmlElement,
          },
        };
        const component = this.tryGetMatchingComponent(dirMap, n.directives);
        this.symbols[nodeId] = n;
        if (component) {
          this.symbols[nodeId] = component;
          node.type.type = SymbolTypes.Component;
        }
        resNodes.push(node);
        addNodes(
          n.children.filter((c) => c instanceof ElementAst) as ElementAst[],
          nodeId
        );
      });
      addNodes(
        (rootNodes || []).filter(
          (c) => c instanceof ElementAst
        ) as ElementAst[],
        TemplateId
      );
    };
  }

  private tryGetMatchingComponent(
    dirMap: { [id: string]: ComponentSymbol | DirectiveSymbol },
    componentDirs: DirectiveAst[]
  ) {
    return componentDirs
      .filter((d) => {
        const ref = d.directive.type.reference;
        const symbol = dirMap[ref.filePath + "#" + ref.name];
        const metadata = symbol.metadata;
        if (symbol && metadata && metadata.isComponent) {
          return true;
        }
        return false;
      })
      .map((d) => dirMap[getId(d.directive.type.reference)])
      .pop();
  }
}
