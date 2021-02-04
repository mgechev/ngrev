import { WorkspaceSymbols } from 'ngast';

export class Project {
  projectSymbols?: WorkspaceSymbols;

  load(tsconfig: string): Promise<WorkspaceSymbols> {
    this.projectSymbols = new WorkspaceSymbols(
      tsconfig,
    );
    return Promise.resolve(this.projectSymbols);
  }
}
