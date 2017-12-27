import { SymbolTypes } from '../../../shared/data-format';
import { Component, Input } from '@angular/core';

export type Color = { color: string; label: string };
export type ColorLegend = Color[];

@Component({
  selector: 'ngrev-color-legend',
  template: `
    <section [class.hidden]="!colors.length" [style.height]="(colors.length * 12 + 20) + 'px'">
      <h1>Legend</h1>
      <div *ngFor="let color of colors" class="colors-wrapper">
        <div class="color" [style.background-color]="color.color"></div>
        <div class="color-label">{{ color.label }}</div>
      </div>
    </section>
  `,
  styles: [
    `
    :host {
      display: block;
      position: relative;
    }
    h1 {
      font-size: 13px;
      margin: 0;
      margin-bottom: 5px;
      color: #555;
    }
    section {
      position: absolute;
      left: 10px;
      bottom: 10px;
      padding: 5px;
      border: 1px solid #999;
      padding-left: 10px;
      padding-right: 10px;
      background-color: rgba(255, 255, 255, 0.8);
      transition: 0.2s opacity;
      opacity: 1;
    }
    .color {
      width: 18px;
      height: 6px;
      margin-top: 3px;
      margin-right: 10px;
      border: 1px solid #999;
    }
    .color-label {
      font-size: 11px;
    }
    .colors-wrapper {
      display: flex;
    }
    .hidden {
      opacity: 0;
    }
  `
  ]
})
export class ColorLegendComponent {
  private _colors: ColorLegend = [];

  get colors() {
    return this._colors || [];
  }

  @Input()
  set colors(val: ColorLegend) {
    this._colors = val;
  }
}
