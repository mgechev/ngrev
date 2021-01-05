import {
  Component,
  Output,
  EventEmitter,
  ViewChildren,
  ElementRef,
  Renderer2,
  QueryList,
  Input,
  ChangeDetectionStrategy
} from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { KeyValuePair } from '../quick-access';
import { Theme } from '../../../../shared/themes/color-map';
import { DOWN_ARROW, ENTER, UP_ARROW } from '@angular/cdk/keycodes';

@Component({
  selector: 'ngrev-quick-access-list',
  templateUrl: './quick-access-list.component.html',
  host: {
    '(document:keydown)': 'onKeyDown($event)'
  },
  styleUrls: ['./quick-access-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickAccessListComponent {
  bindData: KeyValuePair<any>[] = [];

  @Input() theme: Theme;
  @Input() highlight: string;
  @Input()
  set data(val: KeyValuePair<any>[]) {
    this.bindData = val;
    if (this.selection >= val.length) {
      this.highlightItem(0);
    }
  }
  @Output() select = new EventEmitter<KeyValuePair<any>>();
  @ViewChildren('items') items: QueryList<ElementRef>;

  selection = 0;

  constructor(private _renderer: Renderer2, private _sanitizer: DomSanitizer) {}

  selectItem(e, element: KeyValuePair<any>) {
    this.select.emit(element);
    e.stopImmediatePropagation();
  }

  onKeyDown(e) {
    let nextIdx = this.selection;
    if (e.keyCode === UP_ARROW) {
      nextIdx = this.selection - 1;
      if (nextIdx < 0) {
        nextIdx = this.bindData.length - 1;
      }
    }
    if (e.keyCode === DOWN_ARROW) {
      nextIdx = (this.selection + 1) % this.bindData.length;
    }
    if (e.keyCode === ENTER && this.bindData[this.selection]) {
      this.select.emit(this.bindData[this.selection]);
    }
    this.highlightItem(nextIdx);
  }

  formatText(text: string): SafeHtml {
    const map = {};
    (this.highlight || '').split('').forEach(c => (map[c.toLowerCase()] = true));
    const textChars = text.split('');
    return this._sanitizer.bypassSecurityTrustHtml(
      textChars.reduce((a, c) => {
        return a + (map[c.toLowerCase()] ? `<b>${c}</b>` : c);
      }, '')
    );
  }

  private highlightItem(idx: number) {
    if (!this.items) return;
    this.unHighlightItem(this.selection);
    const elements = this.items.toArray();
    const item = elements[idx];
    if (item) {
      this._renderer.addClass(item.nativeElement, 'selected');
      this.ensureVisible(item);
    }
    this.selection = idx;
  }

  private unHighlightItem(idx: number) {
    if (!this.items) return;
    const elements = this.items.toArray();
    const item = elements[idx];
    if (item) {
      this._renderer.removeClass(item.nativeElement, 'selected');
    }
  }

  private ensureVisible(item: ElementRef) {
    const domNode = item.nativeElement as HTMLLIElement;
    const directParent = domNode.parentNode as HTMLUListElement;
    const scrollParent = directParent.parentNode as HTMLElement;
    const nodeTop = domNode.offsetTop;
    const nodeBottom = nodeTop + domNode.offsetHeight;
    const visibleBottom = scrollParent.scrollTop + scrollParent.offsetHeight;
    if (nodeTop - domNode.offsetHeight < scrollParent.scrollTop) {
      scrollParent.scrollTop = nodeTop - domNode.offsetHeight;
    }
    if (nodeBottom > visibleBottom) {
      scrollParent.scrollTop = nodeBottom - scrollParent.offsetHeight - domNode.offsetHeight;
    }
  }
}
