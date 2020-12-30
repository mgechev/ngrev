import {
  Component,
  Output,
  EventEmitter,
  ViewChildren,
  ElementRef,
  Renderer2,
  QueryList,
  AfterViewInit,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { Theme } from '../../../shared/themes/color-map';
import { KeyValuePair, QueryObject } from './quick-access';
import { CONTROL, META, P, ESCAPE, UP_ARROW, DOWN_ARROW } from '@angular/cdk/keycodes';

declare const require: any;
const Fuse = require('fuse.js');

const MetaKeyCodes = [META, CONTROL];

@Component({
  selector: 'ngrev-quick-access',
  templateUrl: './quick-access.component.html',
  host: {
    '(document:keydown)': 'onKeyDown($event)',
    '(document:keyup)': 'onKeyUp($event)',
    '(document:click)': 'onDocumentClick($event)'
  },
  styleUrls: ['./quick-access.component.scss']
})
export class QuickAccessComponent implements AfterViewInit {
  private metaKeyDown = 0;
  private fuzzyBoxVisible = false;
  private symbolName = '';
  private fuse = new Fuse([], { keys: ['name', 'filePath'] });

  constructor(private element: ElementRef, private renderer: Renderer2, private cd: ChangeDetectorRef) {}

  @Input() theme: Theme;

  @Input()
  set queryObject(query: QueryObject) {
    let list = [];
    if (this.fuse) {
      list = this.fuse.list;
    }
    this.fuse = new Fuse(list, { keys: query });
  }

  @Input()
  set queryList(symbols: KeyValuePair<any>[]) {
    this.fuse.set(symbols);
  }

  @Output() select: EventEmitter<string> = new EventEmitter<string>();

  @ViewChildren('input') input: QueryList<ElementRef>;

  onKeyDown(e) {
    if (MetaKeyCodes.indexOf(e.keyCode) >= 0) {
      this.metaKeyDown = e.keyCode;
    }
    if (e.keyCode === P && this.metaKeyDown) {
      this.show();
    }
    if (e.keyCode === ESCAPE) {
      this.hide();
    }
    if (e.keyCode === DOWN_ARROW || e.keyCode === UP_ARROW) {
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    if (MetaKeyCodes.indexOf(e.keyCode) >= 0 && this.metaKeyDown === e.keyCode) {
      this.metaKeyDown = 0;
    }
  }

  ngAfterViewInit() {
    // In most cases (always) fuzzyBoxVisible will be false
    // when this life-cycle hook is invoked.
    // We want to hide the access bar by default in order to
    // not prevent capturing clicks in the visualizer.
    if (!this.fuzzyBoxVisible) {
      this.hide();
    }
    this.input.changes.subscribe(e => (e.first ? e.first.nativeElement.focus() : void 0));
  }

  search() {
    setTimeout(() => this.cd.detectChanges());
    return this.fuse.search(this.symbolName);
  }

  onDocumentClick() {
    this.hide();
  }

  updateKeyword(event) {
    this.symbolName = event.target.value;
    this.cd.detectChanges();
  }

  visible() {
    return this.fuzzyBoxVisible;
  }

  get boxShadow() {
    return `0 0 11px 3px ${this.theme.fuzzySearch.shadowColor}`;
  }

  private show() {
    this.fuzzyBoxVisible = true;
    this.renderer.setStyle(this.element.nativeElement, 'display', 'block');
    this.cd.detectChanges();
  }

  private hide() {
    this.fuzzyBoxVisible = false;
    this.symbolName = '';
    this.renderer.setStyle(this.element.nativeElement, 'display', 'none');
    this.cd.detectChanges();
  }
}
