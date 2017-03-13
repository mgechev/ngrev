import { Component, Input } from '@angular/core';
import { Metadata } from '../../../shared/data-format';

@Component({
  selector: 'ngrev-metadata-view',
  template: `
    <table *ngIf="metadata">
      <thead>
        <th>Name</th>
        <th>Value</th>
      </thead>
      <tbody>
        <tr *ngFor="let pair of metadata">
          <td *ngIf="pair.value">{{pair.key}}</td>
          <td *ngIf="pair.value">{{pair.value}}</td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
  table {
    top: 0;
    right: 0;
    position: absolute;
    background-color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
  }
  td, th {
    border: 1px solid #ccc;
    padding: 8px;
  }
  thead {
    font-weight: bold;
  }
  `]
})
export class MetadataViewComponent {
  @Input() metadata: Metadata;
}
