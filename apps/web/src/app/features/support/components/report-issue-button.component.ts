import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { SchemaCreateReportDto } from '@my-app/shared-types';

import { SupportApiService } from '../data/support-api.service';
import { SupportReportsBus } from '../data/support-reports-bus.service';

/** Maps the visible label to the API enum value (CreateReportDto.issueType). */
export const ISSUE_TYPE_OPTIONS: ReadonlyArray<{
  readonly value: SchemaCreateReportDto['issueType'];
  readonly label: string;
}> = [
  { value: 'BUG', label: 'Bug' },
  { value: 'FEATURE_REQUEST', label: 'Feature request' },
  { value: 'PERFORMANCE', label: 'Performance' },
  { value: 'UI_ISSUE', label: 'UI issue' },
  { value: 'CAMPAIGN_ISSUE', label: 'I have an issue on a campaign' },
  { value: 'OTHER', label: 'Other' },
];

/**
 * US-081 / US-181 — Reusable floating "Report an issue" button
 * placed bottom-right of authenticated layouts (creator + business).
 *
 * Opens a modal containing a reactive form bound to POST /support/reports.
 */
@Component({
  selector: 'app-report-issue-button',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Floating button (visible on every authenticated page) -->
    <button
      type="button"
      class="btn btn-primary"
      data-testid="report-issue-button"
      aria-label="Report an issue"
      (click)="open()"
      style="position:fixed;bottom:1.5rem;inset-inline-end:1.5rem;border-radius:9999px;padding:1rem 1.5rem;box-shadow:var(--glow-primary-hover);z-index:50;"
    >
      ⚠ Report an issue
    </button>

    @if (isOpen()) {
      <div
        class="modal-backdrop"
        role="presentation"
        data-testid="report-modal-backdrop"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:60;display:flex;align-items:center;justify-content:center;padding:1rem;"
        (click)="onBackdropClick($event)"
        (keydown)="onBackdropKey($event)"
      >
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          data-testid="report-modal"
          style="background:var(--bg-card);border:1px solid var(--border-default);border-radius:0.75rem;max-width:520px;width:100%;max-height:90vh;overflow:auto;"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <header class="modal-header" style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border-default);">
            <h2
              id="report-modal-title"
              style="font-weight:700;font-size:var(--text-h2);margin:0;"
            >
              Report an issue
            </h2>
            <p
              style="color:var(--text-secondary);font-size:var(--text-small);margin-top:0.25rem;"
            >
              Describe the problem and our team will get back to you.
            </p>
          </header>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="modal-body" style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
              <div>
                <label class="label label-required" for="issue-type">Issue type</label>
                <select
                  id="issue-type"
                  formControlName="issueType"
                  class="select"
                  data-testid="issue-type-select"
                  required
                >
                  <option value="">Select issue type…</option>
                  @for (opt of issueTypes; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="label" for="issue-title">Title</label>
                <input
                  id="issue-title"
                  formControlName="title"
                  class="input"
                  data-testid="issue-title-input"
                  type="text"
                />
              </div>

              <div>
                <label class="label" for="issue-description">Description</label>
                <textarea
                  id="issue-description"
                  formControlName="description"
                  class="textarea"
                  data-testid="issue-description-input"
                  rows="4"
                ></textarea>
              </div>

              @if (errorMessage()) {
                <div role="alert" data-testid="report-error" style="color:var(--color-danger);font-size:var(--text-small);">
                  {{ errorMessage() }}
                </div>
              }
            </div>

            <div
              class="modal-footer"
              style="padding:1rem 1.5rem;border-top:1px solid var(--border-default);display:flex;gap:0.75rem;justify-content:flex-end;"
            >
              <button
                type="button"
                class="btn btn-ghost"
                data-testid="report-cancel"
                (click)="close()"
                [disabled]="submitting()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                data-testid="report-submit"
                [disabled]="form.invalid || submitting()"
              >
                {{ submitting() ? 'Submitting…' : 'Submit report' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class ReportIssueButtonComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SupportApiService);
  private readonly bus = inject(SupportReportsBus);

  /** Emitted after a report is successfully created (parent can refresh the list). */
  @Output() readonly reportSubmitted = new EventEmitter<void>();

  protected readonly issueTypes = ISSUE_TYPE_OPTIONS;
  protected readonly isOpen = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    issueType: this.fb.nonNullable.control<SchemaCreateReportDto['issueType'] | ''>(
      '',
      { validators: [Validators.required] },
    ),
    title: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    description: this.fb.nonNullable.control(''),
  });

  open(): void {
    this.errorMessage.set(null);
    this.form.reset({ issueType: '', title: '', description: '' });
    this.isOpen.set(true);
  }

  close(): void {
    if (this.submitting()) return;
    this.isOpen.set(false);
  }

  protected onBackdropClick(_event: MouseEvent): void {
    this.close();
  }

  protected onBackdropKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (!value.issueType) return;
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.api
      .submitReport({
        issueType: value.issueType,
        title: value.title,
        description: value.description,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.isOpen.set(false);
          this.reportSubmitted.emit();
          this.bus.emitSubmitted();
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Could not submit your report. Please try again.');
        },
      });
  }
}
