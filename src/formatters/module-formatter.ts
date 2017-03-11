import { ModelFormatter } from './model-formatter';
import { Module } from '../model/module';
import { Graph, Node } from './data-format';

export class ModuleFormatter extends ModelFormatter<Module> {

  format(module: Module): Graph {
    const nodes: Node[] = [{
        id: this.getId(module),
        label: module.symbol.name,
        data: module
      }].concat(module.dependencies.map(d => {
        return {
          id: this.getId(d),
          label: d.symbol.name,
          data: module
        };
      }));
    const edges = nodes.slice(1, nodes.length).map(n => {
      return {
        id: nodes[0].id + '-' + n.id,
        from: nodes[0].id,
        to: n.id
      };
    });
    return {
      nodes,
      edges
    }
  }

}