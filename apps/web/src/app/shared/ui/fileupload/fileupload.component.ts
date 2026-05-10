import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** File upload dropzone. */
@Component({
  selector: 'app-fileupload',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppFileupload {
  readonly variant = input<string>('default');
}
