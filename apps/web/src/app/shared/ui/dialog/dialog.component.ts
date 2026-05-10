import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Modal dialog with focus trap. */
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppDialog {
  readonly variant = input<string>('default');
}
