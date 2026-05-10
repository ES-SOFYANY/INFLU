import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Application sidebar navigation. */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppSidebar {
  readonly variant = input<string>('default');
}
