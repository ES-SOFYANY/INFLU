import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** User avatar with initials fallback. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppAvatar {
  readonly variant = input<string>('default');
}
