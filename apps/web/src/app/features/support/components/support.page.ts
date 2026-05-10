import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SchemaFaqEntryDto, SchemaSupportReportDto } from '@my-app/shared-types';

import { SupportApiService } from '../data/support-api.service';
import { SupportReportsBus } from '../data/support-reports-bus.service';

/**
 * US-080 (creator) / US-180 (business) — Support page.
 *
 * Layout (per wireframes/creator-support.html and wireframes/business-support.html):
 *  - Header: "Support" + subtitle "Report an issue or browse answers to common questions."
 *  - Section "My reports" with badge "N report(s)" and exact empty-state copy
 *      « No reports yet — Use the button in the bottom-right corner to report an issue. »
 *  - Section "Frequently asked questions" rendered as accordion from GET /support/faq.
 *  - Floating "Report an issue" button (US-081 / US-181) in bottom-right corner.
 *
 * The same component is used for both creator and business contexts because the
 * layout is identical and both consume the same endpoints (AC-180-01).
 */
@Component({
  selector: 'app-support-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      id="main"
      role="main"
      data-testid="support-page"
      style="flex:1;padding:var(--space-8);max-width:880px;"
    >
      <h1 style="font-size:var(--text-h1);font-weight:700;">Support</h1>
      <p style="color:var(--text-secondary);margin-bottom:2rem;">
        Report an issue or browse answers to common questions.
      </p>

      <!-- My reports -->
      <section class="card" style="margin-bottom:2rem;padding:1.5rem;">
        <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:0.75rem;">
          My reports
          <span class="badge badge-muted" data-testid="reports-counter">
            {{ reportsCount() }} report(s)
          </span>
        </h2>

        @if (reportsLoading()) {
          <p data-testid="reports-loading" style="color:var(--text-secondary);">Loading…</p>
        } @else if (reportsError()) {
          <p role="alert" data-testid="reports-error" style="color:var(--color-danger);">
            Could not load your reports.
          </p>
        } @else if (reports().length === 0) {
          <div
            class="empty-state"
            role="status"
            data-testid="reports-empty"
            style="padding:2rem 0;text-align:center;"
          >
            <div
              class="empty-illust"
              aria-hidden="true"
              style="width:80px;height:80px;font-size:2rem;margin:0 auto 0.75rem;display:flex;align-items:center;justify-content:center;"
            >
              📋
            </div>
            <p class="empty-desc" style="color:var(--text-secondary);">
              No reports yet — Use the button in the bottom-right corner to report an issue.
            </p>
          </div>
        } @else {
          <ul
            data-testid="reports-list"
            style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.5rem;"
          >
            @for (r of reports(); track r.id) {
              <li
                style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;border:1px solid var(--border-default);border-radius:0.5rem;"
              >
                <span style="font-weight:500;">{{ r.title }}</span>
                <span class="badge badge-muted">{{ r.status }}</span>
              </li>
            }
          </ul>
        }
      </section>

      <!-- FAQ -->
      <section>
        <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">
          Frequently asked questions
        </h2>

        @if (faqLoading()) {
          <p data-testid="faq-loading" style="color:var(--text-secondary);">Loading…</p>
        } @else if (faqError()) {
          <p role="alert" data-testid="faq-error" style="color:var(--color-danger);">
            Could not load FAQ.
          </p>
        } @else {
          <div
            data-testid="faq-list"
            style="display:flex;flex-direction:column;gap:0.5rem;"
          >
            @for (entry of faq(); track entry.id) {
              <details class="card" data-testid="faq-item" style="padding:0;">
                <summary style="padding:1rem 1.25rem;cursor:pointer;font-weight:500;">
                  {{ entry.question }}
                </summary>
                <div
                  style="padding:0 1.25rem 1rem;color:var(--text-secondary);font-size:var(--text-small);"
                >
                  {{ entry.answer }}
                </div>
              </details>
            }
          </div>
        }
      </section>
    </main>
  `,
})
export class SupportPage implements OnInit {
  private readonly api = inject(SupportApiService);
  private readonly bus = inject(SupportReportsBus);

  protected readonly faq = signal<readonly SchemaFaqEntryDto[]>([]);
  protected readonly faqLoading = signal(true);
  protected readonly faqError = signal(false);

  protected readonly reports = signal<readonly SchemaSupportReportDto[]>([]);
  protected readonly reportsLoading = signal(true);
  protected readonly reportsError = signal(false);
  protected readonly reportsCount = computed(() => this.reports().length);

  ngOnInit(): void {
    this.loadFaq();
    this.loadReports();
    // refresh the list whenever a new report is submitted from the global button
    this.bus.submitted$.subscribe(() => this.loadReports());
  }

  private loadFaq(): void {
    this.faqLoading.set(true);
    this.faqError.set(false);
    this.api.getFaq().subscribe({
      next: (entries) => {
        this.faq.set(entries);
        this.faqLoading.set(false);
      },
      error: () => {
        this.faqError.set(true);
        this.faqLoading.set(false);
      },
    });
  }

  private loadReports(): void {
    this.reportsLoading.set(true);
    this.reportsError.set(false);
    this.api.listReports().subscribe({
      next: (page) => {
        this.reports.set(page.items);
        this.reportsLoading.set(false);
      },
      error: () => {
        this.reportsError.set(true);
        this.reportsLoading.set(false);
      },
    });
  }
}
