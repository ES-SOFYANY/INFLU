import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Date picker input. */
@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppDatepicker {
  readonly variant = input<string>('default');
}
