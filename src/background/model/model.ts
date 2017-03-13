import { StaticSymbol } from '@angular/compiler';

export class Model {
  constructor(protected _symbol: StaticSymbol) {}

  get symbol() {
    return this._symbol;
  }
}
