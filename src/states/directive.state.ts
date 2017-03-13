import { DirectiveSymbol, ContextSymbols } from 'ngast';
import { State } from './state';
import { ElementAst, StaticSymbol, DirectiveAst } from '@angular/compiler';
import { DataSet } from 'vis';
import { VisualizationConfig, Metadata, getId, Node } from '../formatters/data-format';
import { getDirectiveMetadata, getElementMetadata } from '../formatters/model-formatter';

interface NodeMap {
  [id: string]: DirectiveSymbol | ElementAst;
}

const TemplateId = 'template';
const TemplateErrorId = 'template-error';

export class DirectiveState extends State {
  private symbols: NodeMap = {};

  constructor(context: ContextSymbols, protected directive: DirectiveSymbol) {
    super(context);
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
      id: nodeId,
      label: s.name,
      data: this.directive
    }, {
      id: TemplateId,
      label: 'Template'
    }];
    const edges = [{
      from: nodeId,
      to: 'template'
    }];
    this.addTemplateNodes(nodes, edges);
    this.addStyleNodes(nodes, edges);
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
          resNodes.push({
            id: nodeId,
            label: n.name,
            data: n as ElementAst
          });
          const component = this.tryGetMatchingComponent(dirMap, n.directives);
          if (component) {
            this.symbols[nodeId] = component;
          }
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
      if (symbol && symbol.isComponent) {
        return true;
      }
      return false;
    }).map(d => dirMap[getId(d.directive.type.reference)]).pop();
  }

  private addStyleNodes(nodes: any[], edges: any[]) {
    
  }  

  private getErrorNode(errors: string[]) {
    return {
      nodes: new DataSet<any>([{
        id: null,
        label: errors.join('\n')
      }]),
      edges: new DataSet<any>([])
    };
  }
}