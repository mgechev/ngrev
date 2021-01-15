import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { NetworkConfig } from './network';
import { Network } from 'vis';
import { ExportToImage } from '../export-to-image.service';
import { IPCBus } from '../../../model/ipc-bus';
import { Message } from '../../../../shared/ipc-constants';

@Component({
  selector: 'ngrev-network',
  template: '',
  styleUrls: ['./network.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkComponent implements OnDestroy {
  @Input()
  get network(): NetworkConfig | undefined { return this._network; }
  set network(value: NetworkConfig | undefined) {
    if (!value) {
      return;
    }
    const scale: number = this._instance.getScale();
    const position: {x: number, y: number} = this._instance.getViewPosition();

    this._instance.setData({
      nodes: value.nodes, edges: value.edges
    });

    this._instance.setOptions(value.options);

    if (this._network?.title === value.title) {
      this._instance.moveTo({
        scale,
        position
      });
    }

    this._exportToImage.enable({
      title: value.title,
      canvas: this._elementRef.nativeElement.querySelector('canvas')
    });

    this._network = value;
  }

  @Output() select: EventEmitter<string> = new EventEmitter<string>();
  @Output() highlight: EventEmitter<string> = new EventEmitter<string>();
  @Output() contextMenu: EventEmitter<string> = new EventEmitter<string>();

  private _network?: NetworkConfig;
  private _instance: Network;
  private _clickTimeout: any;
  private _fitViewListener: () => void;

  constructor(private _elementRef: ElementRef, private _exportToImage: ExportToImage, private _ipcBus: IPCBus) {
    this._instance = new Network(this._elementRef.nativeElement, {});

    this._instance.on('doubleClick', this.selectNode.bind(this));
    this._instance.on('click', this.highlightNode.bind(this));
    this._instance.on('oncontext', this.nodeContext.bind(this));

    this._fitViewListener = this._ipcBus.on(Message.FitView, () => {
      this._instance.fit();
    });
  }

  ngOnDestroy(): void {
    if (this._instance) {
      this._instance.destroy();
      this._exportToImage.disable();
      this._fitViewListener();
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
