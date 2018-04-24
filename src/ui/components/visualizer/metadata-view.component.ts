import { Component, Input } from '@angular/core';
import { Metadata } from '../../../shared/data-format';
import { Theme } from '../../../shared/themes/color-map';

@Component({
  selector: 'ngrev-metadata-view',
  template: `
    <table [class.hidden]="!metadata" [style.background]="theme.legend.background">
      <thead [style.color]="theme.legend.title">
        <th [style.border]="theme.legend.border">Name</th>
        <th [style.border]="theme.legend.border">Value</th>
      </thead>
      <tbody [style.color]="theme.legend.font">
        <tr *ngFor="let pair of metadata">
          <td [style.border]="theme.legend.border" *ngIf="pair.value">{{pair.key}}</td>
          <td [style.border]="theme.legend.border" *ngIf="pair.value">{{pair.value}}</td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [
    `
  table {
    bottom: 7px;
    right: 3px;
    position: absolute;
    background-color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    transition: 0.2s opacity;
    opacity: 1;
  }
  td, th {
    border: 1px solid #ccc;
    padding: 8px;
  }
  thead {
    font-weight: bold;
  }
  .hidden {
    opacity: 0;
  }
  `
  ]
})
export class MetadataViewComponent {
  @Input() theme: Theme;
  @Input() metadata: Metadata;
}
