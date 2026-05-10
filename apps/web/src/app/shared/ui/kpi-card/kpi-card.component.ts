import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** KPI metric card for dashboards. */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppKpiCard {
  readonly variant = input<string>('default');
}
