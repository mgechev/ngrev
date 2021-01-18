import { NgModule, Component, Inject, Injectable, InjectionToken, Directive, Pipe, PipeTransform } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { BasicProvider, TOKEN } from './services';


@Component({
  selector: 'main-component',
  template: '<div>Hello world</div>',
  providers: [{ provide: TOKEN, useValue: true }],
})
export class MainComponent {
  visible: boolean;
  constructor(
    public p: BasicProvider,
    @Inject('primitive') public primitive,
    @Inject(TOKEN) public isTrue,
  ) {}
}

@Directive({
  selector: '[main]',
  providers: [{ provide: TOKEN, useValue: false }]
})
export class MainDirective {
  constructor(public p: BasicProvider) {}
}

@Injectable()
export class CompositeProvider {
  constructor(
    public p: BasicProvider,
    @Inject('primitive') public primitive: string,
  ) {}
}

@Pipe({ name: 'main' })
export class MainPipe implements PipeTransform {
  constructor(public p: BasicProvider) {}
  transform(value: any) {
    return value;
  }
}

@NgModule({
  imports: [CommonModule, BrowserModule, MatExpansionModule, BrowserAnimationsModule],
  exports: [MainComponent],
  declarations: [MainComponent, MainDirective, MainPipe],
  bootstrap: [MainComponent],
  providers: [
    CompositeProvider,
    BasicProvider,
    { provide: 'primitive', useValue: '42' },
  ]
})
export class AppModule {}
