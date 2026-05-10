import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SupportPage } from '../../support/components/support.page';

/**
 * US-080 — Support page for creators (/creator/support).
 * Wraps the shared SupportPage component (US-180 reuses the same one).
 */
@Component({
  selector: 'app-creator-support-page',
  standalone: true,
  imports: [SupportPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-support-page />`,
})
export class CreatorSupportPage {}
