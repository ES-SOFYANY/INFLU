import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Toast notification. */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppToast {
  readonly variant = input<string>('default');
}
