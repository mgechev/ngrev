import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, ElementRef,
  EventEmitter,
  HostBinding,
  Input, OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { Theme } from '../../../shared/themes/color-map';
import { KeyValuePair, QueryObject } from './quick-access';
import { CONTROL, DOWN_ARROW, ESCAPE, META, P, UP_ARROW } from '@angular/cdk/keycodes';
import { fromEvent, Observable, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';

declare const require: any;
const Fuse = require('fuse.js');

const MetaKeyCodes = [META, CONTROL];

@Component({
  selector: 'ngrev-quick-access',
  templateUrl: './quick-access.component.html',
  host: {
    '(document:click)': 'onDocumentClick($event)'
  },
  styleUrls: ['./quick-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickAccessComponent implements OnDestroy {
  @Input() theme!: Theme;

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

  @HostBinding('class.hidden') hidden: boolean = true;

  @ViewChild('input', {static: false})
  set input(value: ElementRef) {
    value?.nativeElement.focus();
  }

  searchQuery$: Subject<string> = new Subject<string>();
  searchResult$: Observable<any>;

  private metaKeyDown = 0;
  private fuse = new Fuse([], { keys: ['name', 'filePath'] });
  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(private _changeDetectorRef: ChangeDetectorRef) {
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      tap((event: KeyboardEvent) => {
        if (MetaKeyCodes.indexOf(event.keyCode) >= 0) {
          this.metaKeyDown = event.keyCode;
        }
        if (event.keyCode === P && this.metaKeyDown) {
          this.show();
        }
        if (event.keyCode === ESCAPE) {
          this.hide();
        }
        if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
          event.preventDefault();
        }
      }),
      takeUntil(this._unsubscribe)
    ).subscribe();

    fromEvent<KeyboardEvent>(document, 'keyup').pipe(
      tap((event: KeyboardEvent) => {
        if (MetaKeyCodes.indexOf(event.keyCode) >= 0 && this.metaKeyDown === event.keyCode) {
          this.metaKeyDown = 0;
        }
      }),
      takeUntil(this._unsubscribe)
    ).subscribe();

    this.searchResult$ = this.searchQuery$.pipe(
      map((searchQuery: string) => {
        return this.fuse.search(searchQuery);
      })
    );
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onDocumentClick() {
    this.hide();
  }

  updateKeyword(searchText: string) {
    this.searchQuery$.next(searchText);
  }

  get boxShadow() {
    return `0 0 11px 3px ${this.theme.fuzzySearch.shadowColor}`;
  }

  hide() {
    this.hidden = true;
    this._changeDetectorRef.markForCheck();
  }

  private show() {
    this.hidden = false;
    this._changeDetectorRef.markForCheck();
  }
}
