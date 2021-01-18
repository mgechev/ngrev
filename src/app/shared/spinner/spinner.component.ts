import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Theme } from '../../../shared/themes/color-map';

@Component({
  selector: 'ngrev-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {
  @Input() theme!: Theme;

  get backgroundColor(): string | undefined {
    if (!this.theme) {
      return;
    }
    return this.theme.background;
  }
}
