import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizerComponent } from './visualizer.component';
import { MetadataViewComponent } from './metadata-view.component';
import { ColorLegendComponent } from './color-legend.component';

@NgModule({
  imports: [CommonModule],
  declarations: [MetadataViewComponent, VisualizerComponent, ColorLegendComponent],
  exports: [VisualizerComponent]
})
export class VisualizerModule {}
