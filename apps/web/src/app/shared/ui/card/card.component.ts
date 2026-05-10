import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Card container with glassmorphism styling. */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppCard {
  readonly variant = input<string>('default');
}
