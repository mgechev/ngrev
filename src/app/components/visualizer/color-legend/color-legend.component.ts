import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Theme } from '../../../../shared/themes/color-map';
import { ColorLegend } from './color-legend';

@Component({
  selector: 'ngrev-color-legend',
  templateUrl: './color-legend.component.html',
  styleUrls: ['./color-legend.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorLegendComponent {
  @Input() theme!: Theme;

  @Input()
  get colors() { return this._colors || []; }
  set colors(value: ColorLegend) {
    this._colors = value;
  }
  private _colors: ColorLegend = [];
}
