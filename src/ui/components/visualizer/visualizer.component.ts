import { Component, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Network, DataSet } from 'vis';
import { StateProxy } from '../../states/state-proxy';
import { VisualizationConfig, Layout, Metadata, Direction, SymbolTypes } from '../../../shared/data-format';
import { NodeTypeColorMap, DefaultColor } from './color-map';

import { ColorLegend, Color } from './color-legend.component';

export const TypeToNameMap = {
  [SymbolTypes.Component]: 'Component',
  [SymbolTypes.ComponentWithDirective]: 'Component with Directive',
  [SymbolTypes.HtmlElement]: 'Html element',
  [SymbolTypes.HtmlElementWithDirective]: 'Html element with Directive',
  [SymbolTypes.Meta]: 'Meta',
  [SymbolTypes.Module]: 'Module',
  [SymbolTypes.Provider]: 'Provider'
};


@Component({
  selector: 'ngrev-visualizer',
  template: `
    <div class="container" #container></div>
    <ngrev-metadata-view [metadata]="metadata"></ngrev-metadata-view>
    <ngrev-color-legend [colors]="usedColors"></ngrev-color-legend>
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

  usedColors: ColorLegend;

  private network: Network;

  ngOnChanges(changes: SimpleChanges) {
    if (this.stateChanged(changes)) {
      this.updateData(this.data);
    }
  }

  private updateData(data: VisualizationConfig<any>) {
    const graph = data.graph;
    this.usedColors = [];
    const colors = new Map<SymbolTypes, Color>();
    const nodes = new DataSet(graph.nodes.map(n => {
      const type = (n.type || { type: -1 }).type;
      const styles = (NodeTypeColorMap[type] || DefaultColor);
      const color = styles.color.background;
      const label = TypeToNameMap[type] || 'Unknown';
      colors.set(type, { color, label})
      return Object.assign({}, n, styles);
    }));
    colors.forEach(val => this.usedColors.push(val));

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
