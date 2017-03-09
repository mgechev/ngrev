import { ProjectSymbols, ContextSymbols } from 'ngast';
import { createProgramFromTsConfig } from '../create-program';
import { readFile, readFileSync } from 'fs';
import { Module } from './module';

export class Project {

  private projectSymbols: ProjectSymbols;
  private rootContext: ContextSymbols;
  private rootModule: Module;

  load(tsconfig: string) {
    this.projectSymbols = new ProjectSymbols({
      create() {
        return createProgramFromTsConfig(tsconfig);
      }
    }, {
      get(name: string) {
        return new Promise((resolve: any, reject: any) => {
          readFile(name, (e, data) => {
            if (e) reject(e);
            else resolve(data.toString());
          });
        });
      },

      getSync(name: string) {
        return readFileSync(name, { encoding: 'utf-8' });
      }
    });
    this.rootContext = this.projectSymbols.getRootContext();
    this.rootModule = Module.fromSummary(this.rootContext.getContextSummary());
    return Promise.resolve(this.rootModule);
  }

  getRootModule() {
    return this.rootModule;
  }
}
