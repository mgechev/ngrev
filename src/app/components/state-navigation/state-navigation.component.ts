import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { SymbolTypes, VisualizationConfig } from '../../../shared/data-format';
import { Theme, DefaultColor } from '../../../shared/themes/color-map';
import { AppComponent } from '../app.component';
import { Memento } from '../../model/state-manager';

const BoxWidth = 40;

const dummyConfig: VisualizationConfig<any> = {
  title: '...',
  graph: {
    nodes: [],
    edges: []
  }
};

const MetaMemento = new Memento(dummyConfig);

@Component({
  selector: 'ngrev-state-navigation',
  template: `
    <h2 *ngIf="states.length" [style.color]="theme.historyLabel">History</h2>
    <ul *ngIf="states.length">
      <li
        [class.state]="!isMetaState(memento)"
        [class.meta]="isMetaState(memento)"
        [style.backgroundColor]="getBackgroundColor(memento)"
        [style.borderColor]="theme.background"
        (click)="changeState(memento)"
        (mouseenter)="showTooltip(index)"
        (mouseleave)="hideTooltip(index)"
        *ngFor="let memento of getRenderableItems(); let index = index">
        <span class="next-arrow" [style.borderLeftColor]="getBackgroundColor(memento)"></span>
        <span [class.visible]="visibleTooltip === index || isMetaState(memento)"
          [class.tooltip]="!isMetaState(memento)"
          [class.label]="isMetaState(memento)">
          {{ memento.state.title }}
        </span>
      </li>
    </ul>
  `,
  styles: [
    `
    :host {
      position: absolute;
      top: 30px;
      width: 100%;
      display: flex;
      flex-direction: column;
      z-index: 10;
    }
    h2 {
      text-align: center;
      display: block;
      width: 100%;
      padding: 0;
      margin: 0;
      margin-bottom: 13px;
      font-size: 13px;
      font-weight: 400;
    }
    ul {
      list-style: none;
      margin: auto;
      padding: 0;
      display: block;
    }
    li.state {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-block;
      margin-left: 2px;
      position: relative;
      cursor: pointer;
      border-width: 1px;
      border-style: solid;
    }
    .tooltip {
      display: none;
      position: absolute;
      text-align: center;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 5px;
      border-radius: 3px;
      top: 24px;
    }
    .visible {
      display: block;
      font-size: 10px;
    }
    li.meta {
      width: 30px;
      height: 20px;
      display: inline-block;
      position: relative;
    }
    .label {
      position: absolute;
      top: -2px;
      left: 13px;
      font-size: 16px;
      display: block;
    }
  `
  ]
})
export class StateNavigationComponent {
  @Input() states: Memento[] = [];
  @Input() maxWidth: number;
  @Input() theme: Theme;
  @Output() select = new EventEmitter<Memento>();

  visibleTooltip = -1;

  constructor(private cd: ChangeDetectorRef) {}

  showTooltip(idx: number) {
    this.visibleTooltip = idx;
    this.cd.detectChanges();
  }

  hideTooltip(idx: number) {
    this.visibleTooltip = -1;
    this.cd.detectChanges();
  }

  changeState(state: Memento) {
    this.select.next(state);
  }

  isMetaState(state: Memento) {
    return state === MetaMemento;
  }

  getBackgroundColor(memento: Memento) {
    if (this.isMetaState(memento)) {
      return 'transparent';
    } else {
      const nodes = memento.state.graph.nodes;
      const first = nodes[0];
      if (first && first.type) {
        const config = this.theme[first.type.type];
        if (config) {
          return config.color.background;
        }
      }
      return DefaultColor.color.background;
    }
  }

  getRenderableItems() {
    const width = this.maxWidth;
    if (!width) {
      return [];
    } else {
      const maxBoxes = Math.floor(width / BoxWidth);
      if (maxBoxes === 0) {
        return [];
      }
      if (maxBoxes >= this.states.length) {
        return this.states;
      }
      const firstHalf = Math.floor(maxBoxes / 2);
      // -1 because of the meta box
      const secondHalf = maxBoxes - firstHalf - 1;
      return this.states
        .slice(0, firstHalf)
        .concat(MetaMemento)
        .concat(this.states.slice(this.states.length - secondHalf, this.states.length));
    }
  }
}
