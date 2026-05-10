import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SupportPage } from '../../support/components/support.page';

/**
 * US-180 — Support page for businesses (/business/support).
 * Wraps the shared SupportPage component (US-080 uses the same one).
 */
@Component({
  selector: 'app-business-support-page',
  standalone: true,
  imports: [SupportPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-support-page />`,
})
export class BusinessSupportPage {}
