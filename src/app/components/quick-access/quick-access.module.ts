import { NgModule } from '@angular/core';
import { QuickAccessComponent } from './quick-access.component';
import { QuickAccessListModule } from './quick-access-list';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    QuickAccessListModule,
    CommonModule,
    FormsModule
  ],
  declarations: [
    QuickAccessComponent
  ],
  exports: [
    QuickAccessComponent
  ]
})
export class QuickAccessModule {}
