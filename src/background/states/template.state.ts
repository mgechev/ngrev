import { DirectiveSymbol, ProjectSymbols, ProviderSymbol } from 'ngast';
import { State } from './state';
import { ElementAst, StaticSymbol, DirectiveAst } from '@angular/compiler';
import { DataSet } from 'vis';
import { VisualizationConfig, Metadata, getId, Node, isAngularSymbol, SymbolTypes, Direction } from '../../shared/data-format';
import { getDirectiveMetadata, getElementMetadata, getProviderMetadata } from '../formatters/model-formatter';
import { DirectiveState } from './directive.state';

interface NodeMap {
  [id: string]: DirectiveSymbol | ElementAst;
}

const TemplateId = 'template';
const TemplateErrorId = 'template-error';

export class TemplateState extends State {
  private symbols: NodeMap = {};

  constructor(context: ProjectSymbols, protected directive: DirectiveSymbol) {
    super(getId(directive.symbol), context);
  }

  getMetadata(id: string): Metadata {
    const s = this.symbols[id];
    if (!s) {
      return null;
    }
    if (s instanceof ElementAst) {
      return getElementMetadata(s);
    } else if (s instanceof DirectiveSymbol) {
      return getDirectiveMetadata(s);
    }
  }

  nextState(id: string) {
    if (id === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[id];
    if (!symbol) {
      return null;
    }
    if (symbol instanceof DirectiveSymbol) {
      return new DirectiveState(this.context, symbol);
    } else {
      return null;
    }
  }

  getData(): VisualizationConfig<any> {
    const s = this.directive.symbol;
    const nodeId = getId(s);
    const nodes: Node<DirectiveSymbol>[] = [{
      id: TemplateId,
      label: `${this.directive.symbol.name}'s Template`,
      type: {
        type: SymbolTypes.Meta,
        angular: false
      }
    }];
    const edges = [];
    this.addTemplateNodes(nodes, edges);
    return {
      graph: {
        nodes, edges
      }
    };
  }

  private addTemplateNodes(resNodes: Node<DirectiveSymbol | ElementAst>[], edges: any[]) {
    const res = this.directive.getTemplateAst();
    const rootNodes = res.templateAst;
    res.errors = res.errors || [];
    res.parseErrors = res.parseErrors || [];
    if (res.errors.length || res.parseErrors.length) {
      const label = res.parseErrors.map(e => e.msg)
        .concat(res.errors.map(e => e.message)).join('\n');
      resNodes.push({
        id: TemplateErrorId,
        label
      })
      edges.push({
        from: TemplateId,
        to: TemplateErrorId
      })
    } else {
      let currentNode = 0;
      const dirMap = this.context.getDirectives().reduce((p, d) => {
        const s = d.symbol;
        p[getId(s)] = d;
        return p;
      }, {} as any);
      const addNodes = (nodes: ElementAst[], parentNodeId: string) => {
        nodes.forEach(n => {
          currentNode += 1;
          const nodeId = 'el-' + currentNode;
          edges.push({
            from: parentNodeId,
            to: nodeId
          });
          const node = {
            id: nodeId,
            label: n.name,
            data: n as ElementAst,
            type: {
              angular: false,
              type: n.directives.length ? SymbolTypes.HtmlElementWithDirective : SymbolTypes.HtmlElement
            }
          };
          const component = this.tryGetMatchingComponent(dirMap, n.directives);
          this.symbols[nodeId] = n;
          if (component) {
            this.symbols[nodeId] = component;
            node.type.type = SymbolTypes.Component;
          }
          resNodes.push(node);
          addNodes(n.children.filter(c => c instanceof ElementAst) as ElementAst[], nodeId);
        })
      };
      addNodes(rootNodes.filter(c => c instanceof ElementAst) as ElementAst[], TemplateId);
    }
  }

  private tryGetMatchingComponent(dirMap: {[id: string]: DirectiveSymbol}, componentDirs: DirectiveAst[]) {
    return componentDirs.filter(d => {
      const ref = d.directive.type.reference;
      const symbol = dirMap[ref.filePath + '#' + ref.name];
      if (symbol && symbol.getNonResolvedMetadata().isComponent) {
        return true;
      }
      return false;
    }).map(d => dirMap[getId(d.directive.type.reference)]).pop();
  }
}
