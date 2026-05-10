import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Text input bound to a FormControl. */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppInput {
  readonly variant = input<string>('default');
}
