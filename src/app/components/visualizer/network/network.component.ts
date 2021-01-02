import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { NetworkConfig } from './network';
import { Network } from 'vis';
import { ExportToImage } from '../export-to-image.service';

@Component({
  selector: 'ngrev-network',
  template: '',
  styleUrls: ['./network.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkComponent implements OnDestroy {
  @Input()
  get network() { return this._network; }
  set network(value: NetworkConfig) {
    this._network = value;

    if (this._instance) {
      this._instance.destroy();
    }

    this._instance = new Network(
      this._elementRef.nativeElement,
      {nodes: value.nodes, edges: value.edges},
      value.options
    );

    this._instance.on('doubleClick', this.selectNode.bind(this));
    this._instance.on('click', this.highlightNode.bind(this));
    this._instance.on('oncontext', this.nodeContext.bind(this));

    this._exportToImage.enable({
      title: value.title,
      canvas: this._elementRef.nativeElement.querySelector('canvas')
    });
  }

  @Output() select: EventEmitter<string> = new EventEmitter<string>();
  @Output() highlight: EventEmitter<string> = new EventEmitter<string>();
  @Output() contextMenu: EventEmitter<string> = new EventEmitter<string>();

  private _network: NetworkConfig;
  private _instance?: Network;
  private _clickTimeout: any;

  constructor(private _elementRef: ElementRef, private _exportToImage: ExportToImage) {}

  ngOnDestroy(): void {
    if (this._instance) {
      this._instance.destroy();
      this._instance = null;
      this._exportToImage.disable();
    }
  }

  selectNode(e: any): void {
    clearTimeout(this._clickTimeout);
    e.event.preventDefault();
    if (e.nodes && e.nodes[0]) {
      this.select.emit(e.nodes[0]);
    }
  }

  highlightNode(e: any): void {
    this._clickTimeout = setTimeout(() => {
      if (e.nodes && e.nodes[0]) {
        this.highlight.emit(e.nodes[0]);
      }
    }, 200) as any;
  }

  nodeContext(e: any): void {
    const node = this._instance.getNodeAt({
      x: e.event.layerX,
      y: e.event.layerY
    }) as string;
    this.contextMenu.emit(node);
  }
}
