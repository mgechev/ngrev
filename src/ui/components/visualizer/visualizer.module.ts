import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizerComponent } from './visualizer.component';
import { MetadataViewComponent } from './metadata-view.component';
import { ColorLegendComponent } from './color-legend.component';
import { ExportToImage } from './export-to-image.service';

@NgModule({
  imports: [CommonModule],
  declarations: [MetadataViewComponent, VisualizerComponent, ColorLegendComponent],
  exports: [VisualizerComponent],
  providers: [ExportToImage]
})
export class VisualizerModule {}
