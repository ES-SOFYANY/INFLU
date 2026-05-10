import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ErrorPageComponent } from './error-page.component';

/**
 * US-201 — 403 page shown by guards when the current user lacks access
 * to the requested area (e.g. CREATOR opening /business/*).
 */
@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [ErrorPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-error-page
      code="403"
      title="Access denied"
      message="You don't have permission to view this page. If you think this is a mistake, contact your administrator or INFLU support."
    />
  `,
})
export class ForbiddenPage {}
