import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Inline badge. */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppBadge {
  readonly variant = input<string>('default');
}
