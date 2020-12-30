import { WorkspaceSymbols } from 'ngast';

export class Project {
  projectSymbols: WorkspaceSymbols;

  load(tsconfig: string) {
    this.projectSymbols = new WorkspaceSymbols(
      tsconfig,
    );
    return Promise.resolve(this.projectSymbols);
  }
}
