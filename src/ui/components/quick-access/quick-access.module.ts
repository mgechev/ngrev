import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuickAccessComponent } from './quck-access.component';
import { QuickAccessListComponent } from './quick-access-list.component';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [QuickAccessComponent, QuickAccessListComponent],
  exports: [QuickAccessComponent]
})
export class QuickAccessModule { }
