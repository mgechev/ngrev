import { NgModule } from '@angular/core';
import { QuickAccessListComponent } from './quick-access-list.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    QuickAccessListComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    QuickAccessListComponent
  ]
})
export class QuickAccessListModule {}
