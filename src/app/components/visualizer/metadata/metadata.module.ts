import { NgModule } from '@angular/core';
import { MetadataComponent } from './metadata.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    MetadataComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MetadataComponent
  ]
})
export class MetadataModule {}
