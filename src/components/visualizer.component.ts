import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Project } from '../model/project-loader';
import { ModuleFormatter } from '../formatters/module-formatter';
import { Network } from 'vis';
import { State, Graph } from '../states/state';

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
export class VisualizerComponent implements OnChanges {
  @Input() state: State;
  @Output() select = new EventEmitter<string>();
  @ViewChild('container') container: ElementRef;

  private network: Network;

  ngOnChanges(changes: SimpleChanges) {
    if (this.stateChanged(changes)) {
      this.updateData(this.state.getData());
    }
  }

  updateData(data: Graph) {
    if (this.network) {
      this.network.destroy();
    }
    this.network = new Network(this.container.nativeElement, data, {
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
    this.network.on('click', this.handleClick.bind(this));
  }

  stateChanged(changes: SimpleChanges) {
    if (changes && changes.state && changes.state.currentValue !== changes.state.previousValue) {
      return true;
    }
    return false;
  }

  handleClick(e: any) {
    if (e.nodes && e.nodes[0]) {
      this.select.next(e.nodes[0]);
    }
  }
}
