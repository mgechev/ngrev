import { StaticSymbol } from '@angular/compiler';
import { Model } from './model';

export class Provider extends Model {

  constructor(_symbol: StaticSymbol) {
    super(_symbol);
  }

  get symbol() {
    return this._symbol;
  }
}