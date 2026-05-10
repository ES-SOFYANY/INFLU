import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Side drawer (sheet). */
@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppDrawer {
  readonly variant = input<string>('default');
}
