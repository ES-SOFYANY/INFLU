import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Top application header (lang switcher, notifications, user menu). */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppHeader {
  readonly variant = input<string>('default');
}
