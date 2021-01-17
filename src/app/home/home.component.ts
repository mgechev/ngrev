import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { OpenDialogReturnValue } from 'electron';
import { ProjectLoadEvent } from './home';

@Component({
  selector: 'ngrev-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  @Output() project: EventEmitter<ProjectLoadEvent> = new EventEmitter<ProjectLoadEvent>();

  constructor() {}

  loadProject(): void {
    window.require('electron').remote.dialog
      .showOpenDialog({ properties: ['openFile', 'multiSelections'] })
      .then(({filePaths}: OpenDialogReturnValue) => {
        if (filePaths && filePaths[0]) {
          this.project.emit({ tsconfig: filePaths[0] });
        }
      });
  }
}
