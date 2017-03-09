import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';

import { AppComponent } from './components/app.component';
import { HomeComponent } from './components/home.component';
import { VisualizerComponent } from './components/visualizer.component';

@NgModule({
  imports: [BrowserModule],
  declarations: [AppComponent, VisualizerComponent, HomeComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
