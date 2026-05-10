import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ErrorPageComponent } from './error-page.component';

/**
 * US-202 — Generic 500 error page with a Retry / Back home CTA.
 */
@Component({
  selector: 'app-server-error-page',
  standalone: true,
  imports: [ErrorPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-error-page
      code="500"
      icon="⚠️"
      title="Something went wrong"
      message="An unexpected error occurred. We've been notified and are looking into it."
      [showRetry]="true"
    />
  `,
})
export class ServerErrorPage {}
