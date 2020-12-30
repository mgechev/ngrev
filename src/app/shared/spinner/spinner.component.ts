import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ngrev-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {}
