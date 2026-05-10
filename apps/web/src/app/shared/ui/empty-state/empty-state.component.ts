import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Empty state placeholder. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppEmptyState {
  readonly variant = input<string>('default');
}
