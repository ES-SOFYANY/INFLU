import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * US-205 — Shared empty-state pattern.
 *
 * Renders an illustration (emoji or icon), a title, a description, and an
 * optional CTA via projected content. Pages should reuse this component to
 * keep empty states consistent across the app (Dashboard, Marketplace, CRM,
 * Payments, Support reports…).
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="empty-state"
      role="status"
      data-testid="empty-state"
      style="padding:2rem 0;text-align:center;"
    >
      @if (illustration()) {
        <div
          class="empty-illust"
          aria-hidden="true"
          style="width:80px;height:80px;font-size:2rem;margin:0 auto 0.75rem;display:flex;align-items:center;justify-content:center;"
        >
          {{ illustration() }}
        </div>
      }
      @if (title()) {
        <h3
          class="empty-title"
          style="font-weight:600;font-size:var(--text-h3);margin:0 0 0.25rem;"
        >
          {{ title() }}
        </h3>
      }
      @if (description()) {
        <p class="empty-desc" style="color:var(--text-secondary);margin:0;">
          {{ description() }}
        </p>
      }
      <div style="margin-top:0.75rem;">
        <ng-content />
      </div>
    </div>
  `,
})
export class AppEmptyState {
  readonly illustration = input<string>('');
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly variant = input<string>('default');
}
