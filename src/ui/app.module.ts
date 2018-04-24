import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';

import { AppComponent } from './components/app.component';
import { HomeComponent } from './components/home.component';
import { VisualizerModule } from './components/visualizer/visualizer.module';
import { ProjectProxy } from './model/project-proxy';
import { StateProxy } from './states/state-proxy';
import { SpinnerComponent } from './components/shared/spinner.component';
import { QuickAccessModule } from './components/quick-access/quick-access.module';
import { StateNavigationComponent } from './components/state-navigation/state-navigation.component';
import { StateManager } from './model/state-manager';
import { IPCBus } from './model/ipc-bus';
import { Configuration } from './model/configuration';

@NgModule({
  imports: [BrowserModule, VisualizerModule, QuickAccessModule],
  declarations: [AppComponent, HomeComponent, SpinnerComponent, StateNavigationComponent],
  bootstrap: [AppComponent],
  providers: [ProjectProxy, StateProxy, StateManager, IPCBus, Configuration]
})
export class AppModule {}
