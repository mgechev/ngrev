import { ChangeDetectionStrategy, Component, ElementRef, Input, Renderer2 } from '@angular/core';

type ButtonType = 'regular' | 'back';

@Component({
  selector: 'button[ngrev-button], a[ngrev-button]',
  template: '<ng-content></ng-content>',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input()
  get buttonType(): ButtonType { return this._buttonType; }
  set buttonType(value: ButtonType) {
    this._renderer.removeClass(this._elementRef.nativeElement, `type-${this._buttonType}`);
    this._renderer.addClass(this._elementRef.nativeElement, `type-${value}`);
    this._buttonType = value;
  }

  private _buttonType: ButtonType = 'regular';

  constructor(private _renderer: Renderer2, private _elementRef: ElementRef) {
    this._renderer.addClass(this._elementRef.nativeElement, `type-${this.buttonType}`);
  }
}
