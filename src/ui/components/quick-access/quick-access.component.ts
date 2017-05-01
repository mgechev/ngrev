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

const Fuse = require('fuse.js');

const MetaKeyCodes = [91, 17];
const PKeyCode = 80;
const ESCKeyCode = 27;
const BackspaceKeyCode = 8;
const UpArrowKeyCode = 38;
const DownArrowKeyCode = 40;

export interface KeyValuePair<T> {
  key: string;
  value: T;
}

export interface QueryObject {
  [index: number]: string[];
}

@Component({
  selector: 'ngrev-quick-access',
  template: `
    <div class="fuzzy-box" *ngIf="fuzzyBoxVisible" (click)="$event.stopImmediatePropagation()">
      <input autofocus #input type="text" (keydown)="updateKeyword($event)">
      <ngrev-quick-access-list
        *ngIf="search() as results"
        [style.display]="results.length ? 'block' : 'none'"
        [data]="results"
        [highlight]="symbolName"
        (select)="select.next($event); hide()"
      >
      </ngrev-quick-access-list>
    </div>
  `,
  host: {
    '(document:keydown)': 'onKeyDown($event)',
    '(document:keyup)': 'onKeyUp($event)',
    '(document:click)': 'onDocumentClick($event)',
  },
  styles: [`
  :host {
    margin: auto;
    margin-top: 45px;
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    width: 70%;
    max-width: 600px;
    height: calc(100% - 45px);
    z-index: 15;
  }
  .fuzzy-box {
    padding: 5px;
    width: 100%;
    max-height: 80%;
    box-shadow: 0 0 11px 3px #ccc;
    background: #fff;
    display: flex;
    flex-direction: column;
  }
  .fuzzy-box input {
    max-height: 60px;
    font-size: 35px;
    outline: none;
    border: 1px solid #ccc;
    padding: 7px;
  }
  `]
})
export class QuickAccessComponent implements AfterViewInit {
  private metaKeyDown = 0;
  private fuzzyBoxVisible = false;
  private symbolName = '';
  private fuse = new Fuse([], { keys: ["name", "filePath"] });

  constructor(private element: ElementRef, private renderer: Renderer2, private cd: ChangeDetectorRef) {}

  @Input() set queryObject(query: QueryObject) {
    let list = [];
    if (this.fuse) {
      list = this.fuse.list;
    }
    this.fuse = new Fuse(list, { keys: query });
  }

  @Input() set queryList(symbols: KeyValuePair<any>[]) {
    this.fuse.set(symbols);
  }

  @Output() select = new EventEmitter<string>();
  @ViewChildren('input') input: QueryList<ElementRef>;

  onKeyDown(e) {
    if (MetaKeyCodes.indexOf(e.keyCode) >= 0) {
      this.metaKeyDown = e.keyCode;
    }
    if (e.keyCode === PKeyCode && this.metaKeyDown) {
      this.show();
    }
    if (e.keyCode === ESCKeyCode) {
      this.hide();
    }
    if (e.keyCode === DownArrowKeyCode || e.keyCode === UpArrowKeyCode) {
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
    this.input.changes
      .subscribe(e => e.first ? e.first.nativeElement.focus() : void 0);
  }

  search() {
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
