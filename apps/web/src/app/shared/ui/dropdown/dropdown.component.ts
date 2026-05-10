import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Dropdown menu. */
@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppDropdown {
  readonly variant = input<string>('default');
}
