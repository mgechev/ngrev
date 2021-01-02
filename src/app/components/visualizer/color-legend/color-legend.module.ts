import { NgModule } from '@angular/core';
import { ColorLegendComponent } from './color-legend.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    ColorLegendComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ColorLegendComponent
  ]
})
export class ColorLegendModule {}
