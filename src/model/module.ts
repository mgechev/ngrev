import {
  CompileNgModuleSummary,
  CompileEntryComponentMetadata,
  CompileIdentifierMetadata,
  StaticSymbol
} from '@angular/compiler';

import { Symbol } from 'ngast';
import { Provider } from './provider';
import { Model } from './model';

export class Module extends Model {

  constructor(_symbol: StaticSymbol,
      private _dependencies: Module[],
      private _exportedDirectives: CompileIdentifierMetadata[],
      private _entryComponents: CompileEntryComponentMetadata[],
      private _providers: Provider[]) {
    super(_symbol);
  }

  get providers() {
    return this._providers;
  }

  get symbol() {
    return this._symbol;
  }

  get dependencies() {
    return this._dependencies;
  }

  get exportedDirectives() {
    return this._exportedDirectives;
  }

  get entryComponents() {
    return this._entryComponents;
  }

  static fromSummary(summary: CompileNgModuleSummary): Module {
    return new Module(summary.type.reference, summary.modules
      .filter(m => m.reference !== summary.type.reference)
      .map(m =>  new Module(m.reference, [], [], [], [])),
        summary.exportedDirectives,
        summary.entryComponents,
        summary.providers.map(p =>
          new Provider(p.provider.token.identifier.reference)));
  }
}