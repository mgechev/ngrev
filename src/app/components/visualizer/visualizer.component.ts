import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { DataSet } from 'vis';

import { Direction, Layout, Metadata, SymbolTypes, VisualizationConfig, Node } from '../../../shared/data-format';
import { BoxColor, BoxTheme, DefaultColor, Theme } from '../../../shared/themes/color-map';
import { Color, ColorLegend } from './color-legend';
import { StateManager } from '../../model/state-manager';
import { combineLatest, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { NetworkConfig } from './network/network';

export const TypeToNameMap: { [key: string]: string } = {
  [SymbolTypes.Component]: 'Component',
  [SymbolTypes.Directive]: 'Directive',
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
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisualizerComponent {
  @Input()
  set data(value: VisualizationConfig<any>) {
    this._data.next(value);
  }

  @Input()
  set theme(value: Theme) {
    this.theme$.next(value);
  }

  @Output() select: EventEmitter<string> = new EventEmitter<string>();
  @Output() highlight: EventEmitter<string> = new EventEmitter<string>();

  usedColors?: ColorLegend;
  metadata: Metadata | null = null;
  networkConfig?: NetworkConfig;
  theme$: ReplaySubject<Theme> = new ReplaySubject<Theme>(1);

  private _data: ReplaySubject<VisualizationConfig<any>> = new ReplaySubject<VisualizationConfig<any>>();

  constructor(private _manager: StateManager, private _changeDetectorRef: ChangeDetectorRef) {
    combineLatest([
      this._data,
      this.theme$
    ]).pipe(
      map(([data, theme]: [VisualizationConfig<any>, Theme]) => {
        const graph = data.graph;
        const colors = new Map<SymbolTypes, Color>();
        const nodes = new DataSet(
          graph.nodes.map((node: Node<any>): Node<any> => {
            const type = (node.type || { type: SymbolTypes.Unknown }).type;
            const styles: BoxTheme = (theme[type as keyof Theme] as BoxTheme)|| DefaultColor;
            const color = styles.color.background;
            const label = TypeToNameMap[type as string] || 'Unknown';
            colors.set(type, { color, label });
            return Object.assign({}, node, styles);
          })
        );

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
            (e as any).color = theme.arrow;
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

        return {
          title: data.title,
          layout,
          nodes,
          edges,
          colors
        }
      }),
      tap(({title, layout, nodes, edges, colors}) => {
        this.usedColors = [];
        colors.forEach(val => this.usedColors!.push(val));

        this.networkConfig = {
          title,
          nodes,
          edges,
          options: {
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
        };
      })
    ).subscribe();
  }

  nodeContext(node: string) {
    this._manager.getMetadata(node).then((metadata: Metadata) => this._showContextMenu(node, metadata)).catch(() => {});
  }

  selectNode(node: string) {
    this.select.next(node);
    this.metadata = null;
  }

  highlightNode(node: string) {
    this.highlight.next(node);
    this.metadata = null;
    this._manager.getMetadata(node).then((metadata: Metadata) => {
      this.metadata = metadata;
      this._changeDetectorRef.markForCheck();
    }).catch(() => {});
  }

  private _showContextMenu(id: string, metadata: Metadata) {
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
            self._changeDetectorRef.markForCheck();
          }
        })
      );
    }
    menu.popup({ window: window.require('electron').remote.getCurrentWindow() });
  }
}
