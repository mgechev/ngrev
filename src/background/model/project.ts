import { ProjectSymbols, ErrorReporter } from 'ngast';
import { readFile, readFileSync } from 'fs';

export class Project {
  projectSymbols: ProjectSymbols;

  load(tsconfig: string, reporter: ErrorReporter) {
    this.projectSymbols = new ProjectSymbols(
      tsconfig,
      {
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
      },
      reporter
    );
    return Promise.resolve(this.projectSymbols);
  }
}
