import { DataSet } from 'vis';
import { Model } from '../model/model';

export interface RenderData {
  nodes: DataSet<any>;
  edges: DataSet<any>;
}

export abstract class ModelFormatter<T extends Model> {
  abstract format(model: T): RenderData;

  getId(model: T) {
    return model.symbol.filePath + '#' + model.symbol.name;
  }
}
