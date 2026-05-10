import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Pagination controls. */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppPagination {
  readonly variant = input<string>('default');
}
