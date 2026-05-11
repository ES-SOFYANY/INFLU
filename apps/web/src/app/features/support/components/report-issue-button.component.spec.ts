import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy } from '@angular/core';

import { ReportIssueButtonComponent } from './report-issue-button.component';

describe('ReportIssueButtonComponent (US-081 / US-181)', () => {
  let fixture: ComponentFixture<ReportIssueButtonComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportIssueButtonComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .overrideComponent(ReportIssueButtonComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
    fixture = TestBed.createComponent(ReportIssueButtonComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('[AC-081-01] renders the floating "Report an issue" button', () => {
    const btn = el().querySelector('[data-testid="report-issue-button"]')!;
    expect(btn).not.toBeNull();
    expect((btn.getAttribute('aria-label') ?? '').trim()).toBe('Report an issue');
    expect(btn.textContent).toContain('Report an issue');
  });

  it('[AC-081-01] clicking the button opens a modal with the exact subtitle', () => {
    el().querySelector<HTMLButtonElement>('[data-testid="report-issue-button"]')!.click();
    fixture.detectChanges();
    const modal = el().ownerDocument.querySelector('[data-testid="report-modal"]')!;
    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain('Describe the problem and our team will get back to you.');
  });

  it('[AC-081-01] Issue type select exposes the 6 EXACT labels', () => {
    el().querySelector<HTMLButtonElement>('[data-testid="report-issue-button"]')!.click();
    fixture.detectChanges();
    const select = el().ownerDocument.querySelector<HTMLSelectElement>(
      '[data-testid="issue-type-select"]',
    )!;
    const labels = Array.from(select.options).map((o) => o.textContent?.trim());
    [
      'Bug',
      'Feature request',
      'Performance',
      'UI issue',
      'I have an issue on a campaign',
      'Other',
    ].forEach((label) => expect(labels).toContain(label));
    expect(select.required).toBe(true);
  });

  it('[AC-081-01] Submit button is disabled until Issue type and Title are filled', () => {
    el().querySelector<HTMLButtonElement>('[data-testid="report-issue-button"]')!.click();
    fixture.detectChanges();
    const submit = el().ownerDocument.querySelector<HTMLButtonElement>(
      '[data-testid="report-submit"]',
    )!;
    expect(submit.disabled).toBe(true);
  });

  it('[AC-081-02] submitting POSTs /support/reports and emits reportSubmitted', fakeAsync(() => {
    let emitted = 0;
    fixture.componentInstance.reportSubmitted.subscribe(() => (emitted += 1));

    el().querySelector<HTMLButtonElement>('[data-testid="report-issue-button"]')!.click();
    fixture.detectChanges();

    const doc = el().ownerDocument;
    const sel = doc.querySelector<HTMLSelectElement>('[data-testid="issue-type-select"]')!;
    sel.value = 'BUG';
    sel.dispatchEvent(new Event('change'));
    const title = doc.querySelector<HTMLInputElement>('[data-testid="issue-title-input"]')!;
    title.value = 'My title';
    title.dispatchEvent(new Event('input'));
    const desc = doc.querySelector<HTMLTextAreaElement>('[data-testid="issue-description-input"]')!;
    desc.value = 'A description';
    desc.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submit = doc.querySelector<HTMLButtonElement>('[data-testid="report-submit"]')!;
    expect(submit.disabled).toBe(false);
    submit.click();
    fixture.detectChanges();

    const req = http.expectOne('/api/v1/support/reports');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      issueType: 'BUG',
      title: 'My title',
      description: 'A description',
    });
    req.flush({
      id: 'r1',
      title: 'My title',
      description: 'A description',
      issueType: 'BUG',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    });
    tick();
    fixture.detectChanges();
    expect(emitted).toBe(1);
    // modal should be closed
    expect(el().ownerDocument.querySelector('[data-testid="report-modal"]')).toBeNull();
  }));

  it('shows an error message when the API returns 500', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="report-issue-button"]')!.click();
    fixture.detectChanges();
    const doc = el().ownerDocument;
    const sel = doc.querySelector<HTMLSelectElement>('[data-testid="issue-type-select"]')!;
    sel.value = 'BUG';
    sel.dispatchEvent(new Event('change'));
    const title = doc.querySelector<HTMLInputElement>('[data-testid="issue-title-input"]')!;
    title.value = 'Boom';
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    doc.querySelector<HTMLButtonElement>('[data-testid="report-submit"]')!.click();
    fixture.detectChanges();
    const req = http.expectOne('/api/v1/support/reports');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'ISE' });
    tick();
    fixture.detectChanges();
    const err = el().ownerDocument.querySelector('[data-testid="report-error"]');
    expect(err).not.toBeNull();
    expect(err!.textContent ?? '').toContain('Could not submit your report');
  }));
});
