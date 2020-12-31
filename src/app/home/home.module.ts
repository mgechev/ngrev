import { NgModule } from '@angular/core';
import { HomeComponent } from './home.component';
import { ButtonModule } from '../shared/button';

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    ButtonModule
  ],
  exports: [
    HomeComponent
  ]
})
export class HomeModule {}
