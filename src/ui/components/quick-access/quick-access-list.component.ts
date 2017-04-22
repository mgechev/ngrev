import {
  Component,
  Output,
  EventEmitter,
  ViewChildren,
  ElementRef,
  QueryList,
  AfterViewInit,
  Input
} from '@angular/core';

import { Symbol } from 'ngast';
import { KeyValuePair } from './quck-access.component';

const EnterKeyCode = 13;
const UpArrowKeyCode = 38;
const DownArrowKeyCode = 40;

@Component({
  selector: 'ngrev-quick-access-list',
  template: `
    <ul *ngIf="data.length">
      <li *ngFor="let element of data; let i=index"
        [class.selected]="i === selection"
        (click)="selectItem($event, element)">
        {{ element.key }}
      </li>
    </ul>
  `,
  host: {
    '(document:keydown)': 'onKeyDown($event)'
  },
  styles: [`
    :host {
      background: white;
      display: block;
      margin-top: -1px;
      width: 101%;
    }
    ul {
      padding: 0px;
      margin-top: 0px;
    }
    li {
      list-style: none;
      padding: 16px;
      border-bottom: 1px solid #ccc;
      border-left: 1px solid #ccc;
      border-right: 1px solid #ccc;
      cursor: pointer;
    }
    .selected {
      background: #efefef;
    }
  `]
})
export class QuickAccessListComponent {
  @Input() data: KeyValuePair<any>[];
  @Output() select = new EventEmitter<KeyValuePair<any>>();

  selection = 0;

  selectItem(e, element: KeyValuePair<any>) {
    this.select.emit(element);
    e.stopImmediatePropagation();
  }

  onKeyDown(e) {
    if (e.keyCode === UpArrowKeyCode) {
      this.selection = this.selection - 1;
      if (this.selection < 0) {
        this.selection = this.data.length - 1;
      }
    }
    if (e.keyCode === DownArrowKeyCode) {
      this.selection = (this.selection + 1) % this.data.length;
    }
    if (e.keyCode === EnterKeyCode && this.data[this.selection]) {
      this.select.emit(this.data[this.selection]);
    }
  }
}
