import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Tabs container. */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppTabs {
  readonly variant = input<string>('default');
}
