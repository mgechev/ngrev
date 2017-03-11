import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizerComponent } from './visualizer.component';
import { MetadataViewComponent } from './metadata-view.component';

@NgModule({
  imports: [CommonModule],
  declarations: [MetadataViewComponent, VisualizerComponent],
  exports: [VisualizerComponent]
})
export class VisualizerModule {}
