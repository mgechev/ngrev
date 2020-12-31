import { NgModule } from '@angular/core';
import { QuickAccessComponent } from './quick-access.component';
import { QuickAccessListModule } from './quick-access-list';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    QuickAccessListModule,
    CommonModule
  ],
  declarations: [
    QuickAccessComponent
  ],
  exports: [
    QuickAccessComponent
  ]
})
export class QuickAccessModule {}
