import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy } from '@angular/core';

import { SupportPage } from './support.page';

describe('SupportPage (US-080 / US-180)', () => {
  let fixture: ComponentFixture<SupportPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .overrideComponent(SupportPage, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
    fixture = TestBed.createComponent(SupportPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushFaq(items: Array<{ id: string; question: string; answer: string }> = []): void {
    http.expectOne('/api/v1/support/faq').flush(items);
  }
  function flushReports(items: unknown[] = []): void {
    http.expectOne('/api/v1/support/reports').flush({ items, page: 1, limit: 20, total: items.length });
  }

  it('renders the EXACT title and subtitle', () => {
    flushFaq();
    flushReports();
    fixture.detectChanges();
    expect(el().textContent).toContain('Support');
    expect(el().textContent).toContain('Report an issue or browse answers to common questions.');
  });

  it('[AC-080-01 / AC-180-02] empty reports section uses the EXACT copy and "0 report(s)" badge', () => {
    flushFaq();
    flushReports([]);
    fixture.detectChanges();
    const counter = el().querySelector('[data-testid="reports-counter"]')!;
    expect(counter.textContent?.trim()).toBe('0 report(s)');
    const empty = el().querySelector('[data-testid="reports-empty"]')!;
    expect(empty.textContent).toContain(
      'No reports yet — Use the button in the bottom-right corner to report an issue.',
    );
  });

  it('[AC-080-02] FAQ section renders one accordion item per entry', () => {
    flushFaq([
      { id: '1', question: 'What is INFLU?', answer: 'A platform.' },
      { id: '2', question: 'How does INFLU help with influencer marketing?', answer: 'AI.' },
      { id: '3', question: 'Can I track campaign performance in real time?', answer: 'Yes.' },
      { id: '4', question: 'Does INFLU support multiple social media platforms?', answer: 'Yes.' },
      { id: '5', question: 'Is INFLU suitable for small businesses?', answer: 'Yes.' },
    ]);
    flushReports();
    fixture.detectChanges();
    const items = el().querySelectorAll('[data-testid="faq-item"]');
    expect(items.length).toBe(5);
    expect(items[0].textContent).toContain('What is INFLU?');
  });

  it('counter reflects the number of reports returned by the API', () => {
    flushFaq();
    flushReports([
      {
        id: 'r1',
        title: 'A',
        description: 'd',
        issueType: 'BUG',
        status: 'OPEN',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'r2',
        title: 'B',
        description: 'd',
        issueType: 'OTHER',
        status: 'OPEN',
        createdAt: '2026-01-02T00:00:00Z',
      },
    ]);
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="reports-counter"]')!.textContent?.trim()).toBe(
      '2 report(s)',
    );
    expect(el().querySelectorAll('[data-testid="reports-list"] li').length).toBe(2);
  });

  it('shows an error state when GET /support/faq fails', () => {
    http.expectOne('/api/v1/support/faq').flush({}, { status: 500, statusText: 'ISE' });
    flushReports();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="faq-error"]')).not.toBeNull();
  });

  it('shows an error state when GET /support/reports fails', () => {
    flushFaq();
    http.expectOne('/api/v1/support/reports').flush({}, { status: 500, statusText: 'ISE' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="reports-error"]')).not.toBeNull();
  });
});
