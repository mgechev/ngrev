import { ModelFormatter } from './model-formatter';
import { Module } from '../model/module';
import { DataSet } from 'vis';

export class ModuleFormatter extends ModelFormatter<Module> {

  format(module: Module) {
    const rawNodes = [{
        id: this.getId(module),
        label: module.symbol.name,
        module
      }].concat(module.dependencies.map(d => {
        return {
          id: this.getId(d),
          label: d.symbol.name,
          module
        };
      }));
    const nodes = new DataSet(rawNodes);
    const edges = new DataSet(rawNodes.slice(1, rawNodes.length).map(n => {
      return {
        from: rawNodes[0].id,
        to: n.id,
        arrows: 'to'
      };
    }));
    return {
      nodes,
      edges
    }
  }

}