import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Autocomplete combobox. */
@Component({
  selector: 'app-combobox',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppCombobox {
  readonly variant = input<string>('default');
}
