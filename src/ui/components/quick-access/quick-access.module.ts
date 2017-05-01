import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { QuickAccessComponent } from './quick-access.component';
import { QuickAccessListComponent } from './quick-access-list.component';

@NgModule({
  imports: [BrowserModule],
  declarations: [QuickAccessComponent, QuickAccessListComponent],
  exports: [QuickAccessComponent]
})
export class QuickAccessModule { }
