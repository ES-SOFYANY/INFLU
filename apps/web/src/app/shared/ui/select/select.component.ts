import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Single-value select bound to a FormControl. */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppSelect {
  readonly variant = input<string>('default');
}
