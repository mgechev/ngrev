import { Component, Input } from '@angular/core';
import { Metadata } from '../../formatters/data-format';

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
    bottom: 0;
    right: 0;
    position: absolute;
  }
  `]
})
export class MetadataViewComponent {
  @Input() metadata: Metadata;
}
