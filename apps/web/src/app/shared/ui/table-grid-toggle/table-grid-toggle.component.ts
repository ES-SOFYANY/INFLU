import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Toggle between table and grid view. */
@Component({
  selector: 'app-table-grid-toggle',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppTableGridToggle {
  readonly variant = input<string>('default');
}
