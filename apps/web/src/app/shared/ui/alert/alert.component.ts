import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Alert banner. */
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppAlert {
  readonly variant = input<string>('default');
}
