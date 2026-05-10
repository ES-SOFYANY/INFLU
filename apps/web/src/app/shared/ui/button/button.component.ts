import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Primary action button (variants: primary | secondary | ghost | danger). */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppButton {
  readonly variant = input<string>('default');
}
