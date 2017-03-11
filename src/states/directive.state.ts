import { DirectiveSymbol, ContextSymbols } from 'ngast';
import { State } from './state';
import { Project } from '../model/project-loader';
import { ElementAst, StaticSymbol } from '@angular/compiler';
import { DataSet } from 'vis';

interface NodeMap {
  [id: string]: StaticSymbol;
}

export class DirectiveState extends State {
  private symbols: NodeMap = {};

  constructor(project: Project, protected directive: DirectiveSymbol, protected context: ContextSymbols) {
    super(project);
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
    return new DirectiveState(this.project, dir, this.context);
  }

  getData() {
    const s = this.directive.symbol;
    const nodeId = s.filePath + '#' + s.name;
    const nodes = [{
      id: nodeId,
      label: s.name
    }, {
      id: 'template',
      label: 'Template'
    }, {
      id: 'styles',
      label: 'Styles'
    }];
    const edges = [{
      id: 'template-' + nodeId,
      from: nodeId,
      to: 'template'
    }, {
      id: 'styles-' + nodeId,
      from: nodeId,
      to: 'styles'
    }];
    this.addTemplateNodes(nodes, edges);
    this.addStyleNodes(nodes, edges);
    return {
      nodes: new DataSet<any>(nodes),
      edges: new DataSet<any>(edges)
    };
  }

  private addTemplateNodes(resNodes: any[], edges: any[]) {
    const res = this.directive.getTemplateAst();
    const rootNodes = res.templateAst;
    if (res.parseErrors.length || res.errors.length) {
      const label = res.parseErrors.map(e => e.msg)
        .concat(res.errors.map(e => e.message)).join('\n');
      resNodes.push({
        id: 'template-error',
        label
      })
      edges.push({
        id: 'template-template-error',
        from: 'template',
        to: 'template-error'
      })
    }
    let currentNode = 0;
    const addNodes = (nodes: ElementAst[], parentNodeId: string) => {
      nodes.forEach(n => {
        currentNode += 1;
        const nodeId = 'el-' + currentNode;
        edges.push({
          id: 'template-edge-' + currentNode + '-' + parentNodeId,
          from: parentNodeId,
          to: nodeId
        });
        resNodes.push({
          id: nodeId,
          label: n.name
        });
        const component = n.directives.filter(d => d.directive.selector === n.name).pop();
        if (component) {
          const ref = component.directive.type.reference
          this.symbols[nodeId] = ref;
        }
        addNodes(n.children.filter(c => c instanceof ElementAst) as ElementAst[], nodeId);
      })
    };
    addNodes(rootNodes.filter(c => c instanceof ElementAst) as ElementAst[], 'template');
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