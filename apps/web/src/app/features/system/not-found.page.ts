import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ErrorPageComponent } from './error-page.component';

/**
 * US-200 — 404 page rendered for any unknown URL.
 * Dark theme, gradient "404" code and "Back home" CTA routed by current role.
 */
@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ErrorPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-error-page
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
    />
  `,
})
export class NotFoundPage {}
