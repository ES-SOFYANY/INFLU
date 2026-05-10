import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Lightweight pub/sub between the global ReportIssueButtonComponent (in the
 * layout shells) and the support page (which displays "My reports"). Avoids
 * direct coupling between the global button and the in-page list.
 */
@Injectable({ providedIn: 'root' })
export class SupportReportsBus {
  private readonly subject = new Subject<void>();
  readonly submitted$ = this.subject.asObservable();

  emitSubmitted(): void {
    this.subject.next();
  }
}
