import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizerComponent } from './visualizer.component';
import { ExportToImage } from './export-to-image.service';
import { NetworkModule } from './network';
import { ColorLegendModule } from './color-legend';
import { MetadataModule } from './metadata';

@NgModule({
  imports: [
    CommonModule,
    NetworkModule,
    ColorLegendModule,
    MetadataModule
  ],
  declarations: [
    VisualizerComponent
  ],
  exports: [
    VisualizerComponent
  ],
  providers: [
    ExportToImage
  ]
})
export class VisualizerModule {}
