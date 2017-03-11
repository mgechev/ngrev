import { DirectiveSymbol, ContextSymbols } from 'ngast';
import { State } from './state';
import { Project } from '../model/project-loader';
import { ElementAst, StaticSymbol, DirectiveAst } from '@angular/compiler';
import { DataSet } from 'vis';
import { VisualizationConfig, Metadata } from '../formatters/data-format';

interface NodeMap {
  [id: string]: StaticSymbol;
}

const TemplateId = 'template';
const TemplateErrorId = 'template-error';

export class DirectiveState extends State {
  private symbols: NodeMap = {};

  constructor(context: ContextSymbols, protected directive: DirectiveSymbol) {
    super(context);
  }

  getMetadata(id: string): Metadata {
    return null;
  }

  nextState(id: string) {
    const symbol = this.symbols[id];
    if (!symbol) {
      return null;
    }
    const dir = this.context.getDirectives()
      .filter(d => {
        const s = d.symbol;
        return s.name === symbol.name &&
            s.filePath === symbol.filePath;
      }).pop();
    return new DirectiveState(this.context, dir);
  }

  getData(): VisualizationConfig<any> {
    const s = this.directive.symbol;
    const nodeId = s.filePath + '#' + s.name;
    const nodes = [{
      id: nodeId,
      label: s.name
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

  private addTemplateNodes(resNodes: any[], edges: any[]) {
    const res = this.directive.getTemplateAst();
    const rootNodes = res.templateAst;
    if (res.parseErrors.length || res.errors.length) {
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
    }
    let currentNode = 0;
    const dirMap = this.context.getDirectives().reduce((p, d) => {
      const s = d.symbol;
      p[s.filePath + '#' + s.name] = d;
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
          label: n.name
        });
        const component = this.tryGetMatchingComponent(dirMap, n.directives);
        if (component) {
          const ref = component.directive.type.reference
          this.symbols[nodeId] = ref;
        }
        addNodes(n.children.filter(c => c instanceof ElementAst) as ElementAst[], nodeId);
      })
    };
    addNodes(rootNodes.filter(c => c instanceof ElementAst) as ElementAst[], TemplateId);
  }

  private tryGetMatchingComponent(dirMap: {[id: string]: DirectiveSymbol}, componentDirs: DirectiveAst[]) {
    return componentDirs.filter(d => {
      const ref = d.directive.type.reference;
      const symbol = dirMap[ref.filePath + '#' + ref.name];
      if (symbol && symbol.isComponent) {
        return true;
      }
      return false;
    }).pop();
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