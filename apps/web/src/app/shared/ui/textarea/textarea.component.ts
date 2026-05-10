import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Multi-line text input. */
@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppTextarea {
  readonly variant = input<string>('default');
}
