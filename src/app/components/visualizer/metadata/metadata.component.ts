import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Metadata } from '../../../../shared/data-format';
import { Theme } from '../../../../shared/themes/color-map';

@Component({
  selector: 'ngrev-metadata-view',
  templateUrl: './metadata.component.html',
  styleUrls: ['./metadata.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataComponent {
  @Input() theme!: Theme;
  @Input() metadata!: Metadata | null;
}
