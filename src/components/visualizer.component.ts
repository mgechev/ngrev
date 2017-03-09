import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Project } from '../model/project-loader';
import { ModuleFormatter } from '../formatters/module-formatter';
import { Network } from 'vis';

@Component({
  selector: 'ngrev-visualizer',
  template: `
    <div class="container" #container></div>
  `,
  styles: [`
    .container {
      width: 100%;
      height: 100%;
    }
    :host {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class VisualizerComponent implements AfterViewInit {
  @Input() project: Project;
  @ViewChild('container') container: ElementRef;

  ngAfterViewInit() {
    const formatter = new ModuleFormatter();
    const rootModule = this.project.getRootModule();
    const data = formatter.format(rootModule);
    const network = new Network(this.container.nativeElement, data, {
      nodes: {
        shape: 'box',
        fixed: true,
        shapeProperties: {
          borderRadius: 1,
          interpolation: true,
          borderDashes: false,
          useImageSize: false,
          useBorderWithImage: false
        }
      }
    });
  }
}
