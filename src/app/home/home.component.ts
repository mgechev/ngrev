import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ProjectLoadEvent } from './home';
import { FileDialogService } from './file-dialog.service';
import { Theme } from '../../shared/themes/color-map';

@Component({
  selector: 'ngrev-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  @Input() theme!: Theme;
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

  get backgroundColor(): string | undefined {
    if (!this.theme) {
      return;
    }
    return this.theme.background;
  }
}
