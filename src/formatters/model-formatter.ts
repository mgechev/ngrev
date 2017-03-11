import { DataSet } from 'vis';
import { Model } from '../model/model';
import { Graph } from './data-format';

export abstract class ModelFormatter<T extends Model> {
  abstract format(model: T): Graph<T>;

  getId(model: T) {
    return model.symbol.filePath + '#' + model.symbol.name;
  }
}
