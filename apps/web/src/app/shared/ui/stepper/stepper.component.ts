import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Multi-step progress indicator. */
@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppStepper {
  readonly variant = input<string>('default');
}
