import { DirectiveSymbol } from 'ngast';
import { State } from './state';
import { Project } from '../model/project-loader';
import { DataSet } from 'vis';

export class DirectiveState extends State {

  constructor(project: Project, protected directive: DirectiveSymbol) {
    super(project);
  }

  nextState() {
    return null;
  }

  getData() {
    const res = this.directive.getTemplateAst();
    if (res.parseErrors.length || res.errors.length) {
      return this.getErrorNode(res.parseErrors.map(e => e.msg)
        .concat(res.errors.map(e => e.message)));
    } else {
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
  }

  private addTemplateNodes(nodes: any[], edges: any[]) {
    
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