import {
  Component,
  Input,
  OnDestroy,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';
import { Network, DataSet } from 'vis';

import { VisualizationConfig, Layout, Metadata, Direction, SymbolTypes } from '../../../shared/data-format';
import { DefaultColor, Theme } from '../../../shared/themes/color-map';
import { ColorLegend, Color } from './color-legend.component';
import { ExportToImage } from './export-to-image.service';

export const TypeToNameMap = {
  [SymbolTypes.Component]: 'Component',
  [SymbolTypes.ComponentWithDirective]: 'Component with Directive',
  [SymbolTypes.HtmlElement]: 'HTML element',
  [SymbolTypes.HtmlElementWithDirective]: 'HTML element with Directive',
  [SymbolTypes.ComponentOrDirective]: 'Component or Directive',
  [SymbolTypes.Meta]: 'Meta',
  [SymbolTypes.Pipe]: 'Pipe',
  [SymbolTypes.Module]: 'Module',
  [SymbolTypes.LazyModule]: 'Lazy Module',
  [SymbolTypes.Provider]: 'Provider'
};

@Component({
  selector: 'ngrev-visualizer',
  template: `
    <div class="container" #container [style.backgroundColor]="theme.background"></div>
    <ngrev-metadata-view [theme]="theme" [metadata]="(metadata || {}).properties"></ngrev-metadata-view>
    <ngrev-color-legend [theme]="theme" [colors]="usedColors"></ngrev-color-legend>
  `,
  styles: [
    `
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
    `
  ]
})
export class VisualizerComponent implements OnChanges, OnDestroy {
  @Input() data: VisualizationConfig<any>;
  @Input() metadataResolver: (id: string) => Promise<Metadata>;
  @Input() theme: Theme;

  @Output() select = new EventEmitter<string>();
  @Output() highlight = new EventEmitter<string>();

  @ViewChild('container') container: ElementRef;

  usedColors: ColorLegend;
  metadata: Metadata | null;

  private network: Network | null;
  private initialized = false;
  private clickTimeout = 0;

  constructor(private exportToImage: ExportToImage, private cd: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.stateChanged(changes) && this.initialized) {
      this.updateData(this.data);
    }
  }

  ngAfterViewInit(): void {
    this.initialized = true;
    if (this.data) {
      this.updateData(this.data);
    }
  }

  ngOnDestroy(): void {
    if (this.network) {
      this.network.destroy();
      this.network = null;
      this.exportToImage.disable();
    }
  }

  private updateData(data: VisualizationConfig<any>) {
    const graph = data.graph;
    this.usedColors = [];
    const colors = new Map<SymbolTypes, Color>();
    const nodes = new DataSet(
      graph.nodes.map(n => {
        const type = (n.type || { type: SymbolTypes.Unknown }).type;
        const styles = this.theme[type] || DefaultColor;
        const color = styles.color.background;
        const label = TypeToNameMap[type] || 'Unknown';
        colors.set(type, { color, label });
        return Object.assign({}, n, styles);
      })
    );
    colors.forEach(val => this.usedColors.push(val));

    const edges = new DataSet(
      graph.edges.map(e => {
        const copy = Object.assign({}, e);
        if (e.direction === Direction.To) {
          (e as any).arrows = 'to';
        } else if (e.direction === Direction.From) {
          (e as any).arrows = 'from';
        } else if (e.direction === Direction.Both) {
          (e as any).arrows = 'from, to';
        }
        (e as any).color = this.theme.arrow;
        (e as any).labelHighlightBold = false;
        (e as any).selectionWidth = 0.5;
        return e;
      })
    );
    let layout: any = {
      hierarchical: {
        sortMethod: 'directed',
        enabled: true,
        direction: 'LR',
        edgeMinimization: true,
        parentCentralization: true,
        nodeSpacing: 50
      }
    };
    if (data.layout === Layout.Regular) {
      layout = {
        hierarchical: {
          enabled: false
        },
        improvedLayout: true,
        randomSeed: 2
      };
    }
    if (data.layout === Layout.HierarchicalUDDirected) {
      layout.improvedLayout = true;
      layout.hierarchical.direction = 'UD';
      layout.hierarchical.nodeSpacing = 200;
      layout.hierarchical.sortMethod = 'directed';
    }
    if (this.network) {
      this.network.destroy();
    }
    this.network = new Network(
      this.container.nativeElement,
      { nodes, edges },
      {
        interaction: {
          dragNodes: true
        },
        layout,
        physics: {
          enabled: false
        },
        nodes: {
          shape: 'box',
          shapeProperties: {
            borderRadius: 1,
            interpolation: true,
            borderDashes: false,
            useImageSize: false,
            useBorderWithImage: false
          }
        }
      }
    );
    this.network.on('doubleClick', this.selectNode.bind(this));
    this.network.on('click', this.highlightNode.bind(this));
    this.network.on('oncontext', this.nodeContext.bind(this));
    this.exportToImage.enable({
      title: this.data.title,
      canvas: this.container.nativeElement.querySelector('canvas')
    });
  }

  private nodeContext(e: any) {
    if (this.network) {
      const node = this.network.getNodeAt({
        x: e.event.layerX,
        y: e.event.layerY
      }) as string;

      if (node) {
        this.metadataResolver(node).then((metadata: Metadata) => this.showContextMenu(node, metadata));
      }
    }
  }

  private showContextMenu(id: string, metadata: Metadata) {
    const { Menu, MenuItem } = window.require('electron').remote;
    const menu = new Menu();
    const self = this;
    if (metadata && metadata.filePath) {
      menu.append(
        new MenuItem({
          label: 'Open File',
          click() {
            if (metadata && metadata.filePath) {
              window.require('electron').shell.openPath(metadata.filePath);
            }
          }
        })
      );
      menu.append(
        new MenuItem({
          type: 'separator'
        })
      );
    }
    menu.append(
      new MenuItem({
        label: 'Select',
        click() {
          self.select.next(id);
        }
      })
    );
    if (metadata) {
      menu.append(
        new MenuItem({
          label: 'View Metadata',
          click() {
            self.metadata = metadata;
          }
        })
      );
    }
    menu.popup({ window: window.require('electron').remote.getCurrentWindow() });
  }

  private stateChanged(changes: SimpleChanges) {
    if (
      (changes && changes.data && changes.data.currentValue !== changes.data.previousValue) ||
      changes.theme.currentValue !== changes.theme.previousValue
    ) {
      return true;
    }
    return false;
  }

  private selectNode(e: any) {
    clearTimeout(this.clickTimeout);
    e.event.preventDefault();
    if (e.nodes && e.nodes[0]) {
      this.select.next(e.nodes[0]);
      this.metadata = null;
    }
  }

  private highlightNode(e: any) {
    this.clickTimeout = setTimeout(() => {
      if (e.nodes && e.nodes[0]) {
        this.highlight.next(e.nodes[0]);
        this.metadata = null;
        this.metadataResolver(e.nodes[0]).then((metadata: Metadata) => {
          this.metadata = metadata;
          this.cd.detectChanges();
        });
      }
    }, 200) as any;
  }
}
