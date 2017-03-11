import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Project } from '../model/project-loader';
import { ModuleFormatter } from '../formatters/module-formatter';
import { Network, DataSet } from 'vis';
import { State } from '../states/state';
import { Visualization, Layout } from '../formatters/data-format';

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

  updateData(data: Visualization) {
    const graph = data.graph;
    const nodes = new DataSet(graph.nodes);
    const edges = new DataSet(graph.edges);
    let layout: any = {
      hierarchical: {
        sortMethod: 'directed',
        enabled: true
      }
    };
    if (data.layout === Layout.Regular) {
      layout = {
        randomSeed: 2
      };
    }
    if (this.network) {
      this.network.destroy();
    }
    this.network = new Network(this.container.nativeElement, { nodes, edges }, {
      layout,
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
