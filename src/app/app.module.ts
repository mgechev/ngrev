import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { VisualizerModule } from './components/visualizer/visualizer.module';
import { QuickAccessModule } from './components/quick-access';
import { SpinnerModule } from './shared/spinner';
import { HomeModule } from './home';
import { ButtonModule } from './shared/button';
import { StateNavigationModule } from './components/state-navigation';

@NgModule({
  imports: [
    BrowserModule,
    VisualizerModule,
    QuickAccessModule,
    SpinnerModule,
    HomeModule,
    ButtonModule,
    StateNavigationModule
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {}
