import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BusinessPaymentsPage } from './payments.page';

function row(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    creator: { id: 'c1', name: 'Ali' },
    brand: { id: 'b1', name: 'Eucerin' },
    status: 'PENDING',
    amount: 4000,
    currency: 'MAD',
    requestedAt: '2026-04-21T10:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

describe('BusinessPaymentsPage (US-160 / US-161)', () => {
  let fixture: ComponentFixture<BusinessPaymentsPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessPaymentsPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessPaymentsPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/v1/business/brands').flush([{ id: 'b1', name: 'Eucerin' }]);
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushPayments(items: ReadonlyArray<unknown>, expectedType = 'MARKETPLACE'): void {
    const req = http.expectOne((r) => r.url === '/api/v1/business/payments');
    expect(req.request.params.get('type')).toBe(expectedType);
    req.flush({ items, total: items.length, page: 1, limit: 20 });
    fixture.detectChanges();
  }

  it('renders the title and subtitle from the wireframe', () => {
    flushPayments([]);
    expect(el().querySelector('h1')!.textContent).toContain('Business Payments');
    expect(el().textContent).toContain('Manage and review all your business payment records.');
  });

  it('[AC-160-01] "Marketplace payments" tab is selected by default; "Campaign payments" available', () => {
    const mk = el().querySelector<HTMLButtonElement>('[data-testid="tab-marketplace"]')!;
    const cp = el().querySelector<HTMLButtonElement>('[data-testid="tab-campaign"]')!;
    expect(mk.classList.contains('active')).toBe(true);
    expect(mk.getAttribute('aria-selected')).toBe('true');
    expect(cp.classList.contains('active')).toBe(false);
    expect(cp.getAttribute('aria-selected')).toBe('false');
    expect(mk.textContent!.trim()).toBe('Marketplace payments');
    expect(cp.textContent!.trim()).toBe('Campaign payments');
    flushPayments([]);
  });

  it('[AC-160-01] switching to "Campaign payments" reloads with type=CAMPAIGN', () => {
    flushPayments([], 'MARKETPLACE');
    el().querySelector<HTMLButtonElement>('[data-testid="tab-campaign"]')!.click();
    fixture.detectChanges();
    flushPayments([], 'CAMPAIGN');
    expect(
      el().querySelector('[data-testid="tab-campaign"]')!.classList.contains('active'),
    ).toBe(true);
  });

  it('[AC-160-02] selecting brand and status filters the table; Clear resets them', () => {
    flushPayments([]);

    const brandSelect = el().querySelector<HTMLSelectElement>('[data-testid="filter-brand"]')!;
    brandSelect.value = brandSelect.options[1].value;
    brandSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    let req = http.expectOne((r) => r.url === '/api/v1/business/payments');
    expect(req.request.params.get('brand')).toBe('b1');
    req.flush({ items: [], total: 0, page: 1, limit: 20 });
    fixture.detectChanges();

    const statusSelect = el().querySelector<HTMLSelectElement>('[data-testid="filter-status"]')!;
    statusSelect.value = 'COMPLETED';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    req = http.expectOne((r) => r.url === '/api/v1/business/payments');
    expect(req.request.params.get('status')).toBe('COMPLETED');
    req.flush({ items: [], total: 0, page: 1, limit: 20 });
    fixture.detectChanges();

    el().querySelector<HTMLButtonElement>('[data-testid="filter-clear"]')!.click();
    fixture.detectChanges();
    req = http.expectOne((r) => r.url === '/api/v1/business/payments');
    expect(req.request.params.get('brand')).toBeNull();
    expect(req.request.params.get('status')).toBeNull();
    req.flush({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('[AC-161-01] table exposes the EXACT 7 columns', () => {
    flushPayments([row('p1')]);
    const headers = Array.from(
      el().querySelectorAll('[data-testid="payments-table"] thead th'),
    ).map((h) => h.textContent?.trim());
    expect(headers).toEqual([
      'Creator',
      'Brand',
      'Status',
      'Amount (Dhs)',
      'Requested At',
      'Completed At',
      'Actions',
    ]);
  });

  it('[AC-161-01] Completed At renders "--" when completedAt is null', () => {
    flushPayments([row('p1', { completedAt: null })]);
    expect(el().querySelector('[data-testid="completed-at-p1"]')!.textContent!.trim()).toBe('--');
  });

  it('[AC-161-01] Completed At renders the formatted date when present', () => {
    flushPayments([
      row('p2', { status: 'COMPLETED', completedAt: '2026-04-22T10:00:00.000Z' }),
    ]);
    expect(el().querySelector('[data-testid="completed-at-p2"]')!.textContent!.trim()).toBe(
      '22/04/2026',
    );
  });

  it('[AC-161-02] empty state shows EXACT text "No payment data found"', () => {
    flushPayments([]);
    const empty = el().querySelector('[data-testid="empty"]')!;
    expect(empty).toBeTruthy();
    expect(empty.querySelector('.empty-title')!.textContent!.trim()).toBe(
      'No payment data found',
    );
  });

  it('shows error banner when payments fetch fails', () => {
    http
      .expectOne((r) => r.url === '/api/v1/business/payments')
      .flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="error"]')).toBeTruthy();
  });
});

