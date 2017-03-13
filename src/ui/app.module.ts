import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';

import { AppComponent } from './components/app.component';
import { HomeComponent } from './components/home.component';
import { VisualizerModule } from './components/visualizer/visualizer.module';
import { ProjectProxy } from './model/project-proxy';
import { StateProxy } from './states/state-proxy';

@NgModule({
  imports: [BrowserModule, VisualizerModule],
  declarations: [AppComponent, HomeComponent],
  bootstrap: [AppComponent],
  providers: [ProjectProxy, StateProxy]
})
export class AppModule { }
