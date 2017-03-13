import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Network, DataSet } from 'vis';
import { StateProxy } from '../../states/state-proxy';
import { VisualizationConfig, Layout, Metadata, Direction, SymbolTypes } from '../../../shared/data-format';

const NodeTypeColorMap = {
  [SymbolTypes.Component]: {
    color: {
      background: '#f8f800',
      border: '#fcda1e',
      highlight: {
        background: '#f8f800',
        border: '#fcda1e',
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.ComponentWithDirective]: {
    color: {
      background: '#FFC0CB',
      border: '#FFB8C5',
      highlight: {
        background: '#FFC0CB',
        border: '#FFB8C5'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.HtmlElement]: {
    color: {
      background: '#C2FABC',
      border: '#000000',
      highlight: {
        background: '#C2FABC',
        border: '#000000'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.HtmlElementWithDirective]: {
    color: {
      background: '#ffa807',
      border: '#e5a124',
      highlight: {
        background: '#ffa807',
        border: '#e5a124'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.Meta]: {
    color: {
      background: '#c8c8c8',
      border: '#000000',
      highlight: {
        background: '#c8c8c8',
        border: '#000000'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.Module]: {
    color: {
      background: '#97C2FC',
      border: '#000000',
      highlight: {
        background: '#97C2FC',
        border: '#000000'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.Provider]: {
    color: {
      background: '#EB7DF4',
      border: '#EA79F4',
      highlight: {
        background: '#EB7DF4',
        border: '#EA79F4'
      }
    },
    font: {
      color: '#000000'
    }
  }
};

const DefaultColor = {
  color: {
    background: '#ffffff',
    border: '#000000',
    highlight: {
      background: '#ffffff',
      border: '#000000'
    }
  },
  font: {
    color: '#000000'
  }
};

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
  @Input() data: VisualizationConfig<any>;
  @Input() metadata: Metadata;

  @Output() select = new EventEmitter<string>();
  @Output() highlight = new EventEmitter<string>();

  @ViewChild('container') container: ElementRef;

  private network: Network;

  ngOnChanges(changes: SimpleChanges) {
    if (this.stateChanged(changes)) {
      this.updateData(this.data);
    }
  }

  private updateData(data: VisualizationConfig<any>) {
    const graph = data.graph;
    const nodes = new DataSet(graph.nodes.map(n => {
      console.log(NodeTypeColorMap[(n.type || { type: -1 }).type]);
      return Object.assign({}, n, NodeTypeColorMap[(n.type || { type: -1 }).type] || DefaultColor);
    }));
    const edges = new DataSet(graph.edges.map(e => {
      const copy = Object.assign({}, e);
      if (e.direction === Direction.To) {
        (e as any).arrows = 'to';
      } else if (e.direction === Direction.From) {
        (e as any).arrows = 'from';
      } else if (e.direction === Direction.Both) {
        (e as any).arrows = 'from, to';
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
    this.network.on('doubleClick', this.selectNode.bind(this));
    this.network.on('click', this.highlightNode.bind(this));
  }

  private stateChanged(changes: SimpleChanges) {
    if (changes && changes.data && changes.data.currentValue !== changes.data.previousValue) {
      return true;
    }
    return false;
  }

  private selectNode(e: any) {
    if (e.nodes && e.nodes[0]) {
      this.select.next(e.nodes[0]);
      this.metadata = null;
    }
  }

  private highlightNode(e: any) {
    if (e.nodes && e.nodes[0]) {
      this.highlight.next(e.nodes[0]);
      this.metadata = null;
    }
  }
}
