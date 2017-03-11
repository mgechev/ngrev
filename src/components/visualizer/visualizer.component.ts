import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Project } from '../../model/project-loader';
import { Network, DataSet } from 'vis';
import { State } from '../../states/state';
import { VisualizationConfig, Layout, Metadata, Direction } from '../../formatters/data-format';

@Component({
  selector: 'ngrev-visualizer',
  template: `
    <div class="container" #container></div>
    <ngrev-metadata-view [metadata]="metadata"></ngrev-metadata-view>
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
      position: relative;
    }
  `]
})
export class VisualizerComponent implements OnChanges {
  @Input() state: State;
  @Output() select = new EventEmitter<string>();
  @ViewChild('container') container: ElementRef;
  metadata: Metadata;

  private network: Network;

  ngOnChanges(changes: SimpleChanges) {
    if (this.stateChanged(changes)) {
      this.updateData(this.state.getData());
    }
  }

  private updateData(data: VisualizationConfig<any>) {
    const graph = data.graph;
    const nodes = new DataSet(graph.nodes);
    const edges = new DataSet(graph.edges.map(e => {
      const copy = Object.assign({}, e);
      if (e.direction === Direction.To) {
        (e as any).arrow = 'to';
      } else if (e.direction === Direction.From) {
        (e as any).arrow = 'from';
      } else if (e.direction === Direction.Both) {
        (e as any).arrow = 'from to';
      }
      return e;
    }));
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
    this.network.on('doubleClick', this.tryChangeState.bind(this));
    this.network.on('click', this.tryShowDetails.bind(this));
  }

  private stateChanged(changes: SimpleChanges) {
    if (changes && changes.state && changes.state.currentValue !== changes.state.previousValue) {
      return true;
    }
    return false;
  }

  private tryChangeState(e: any) {
    if (e.nodes && e.nodes[0]) {
      this.select.next(e.nodes[0]);
      this.metadata = null;
    }
  }

  private tryShowDetails(e: any) {
    if (e.nodes && e.nodes[0]) {
      this.metadata = this.state.getMetadata(e.nodes[0]);
    }
  }
}
