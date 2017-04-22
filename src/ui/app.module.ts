import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './components/app.component';
import { HomeComponent } from './components/home.component';
import { VisualizerModule } from './components/visualizer/visualizer.module';
import { ProjectProxy } from './model/project-proxy';
import { StateProxy } from './states/state-proxy';
import { SpinnerComponent } from './components/shared/spinner.component';
import { QuickAccessModule } from './components/quick-access/quick-access.module';

@NgModule({
  imports: [BrowserModule, VisualizerModule, QuickAccessModule],
  declarations: [AppComponent, HomeComponent, SpinnerComponent],
  bootstrap: [AppComponent],
  providers: [ProjectProxy, StateProxy]
})
export class AppModule { }
