import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { ProjectLoadEvent } from './home';
import { FileDialogService } from './file-dialog.service';

@Component({
  selector: 'ngrev-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  @Output() project: EventEmitter<ProjectLoadEvent> = new EventEmitter<ProjectLoadEvent>();

  constructor(private _dialog: FileDialogService) {}

  loadProject(): void {
    this._dialog.open({ properties: ['openFile', 'multiSelections'] })
      .then(({filePaths}: {filePaths: string[]}) => {
        if (filePaths && filePaths[0]) {
          this.project.emit({ tsconfig: filePaths[0] });
        }
      });
  }
}
