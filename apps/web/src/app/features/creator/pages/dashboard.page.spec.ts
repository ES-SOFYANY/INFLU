import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CreatorDashboardPage } from './dashboard.page';

describe('CreatorDashboardPage', () => {
  let fixture: ComponentFixture<CreatorDashboardPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorDashboardPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorDashboardPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushKpis(overrides: Partial<Record<string, unknown>> = {}): void {
    const req = http.expectOne('/api/creator/me/dashboard-kpis');
    req.flush({
      totalCollaborations: 0,
      pendingOpportunities: 0,
      pendingMatchings: null,
      contentToSubmit: 0,
      submissionDeadline: null,
      contentToPublish: 0,
      publicationDeadline: null,
      pendingPayments: 0,
      revenueGenerated: 0,
      influScore: null,
      currency: 'MAD',
      ...overrides,
    });
  }

  function flushCollabs(items: unknown[] = []): void {
    const req = http.expectOne((r) => r.url === '/api/creator/me/collaborations');
    req.flush({ items, page: 1, limit: 20, total: items.length });
  }

  it('[AC-020-01] renders the 10 KPI cards with the exact labels', () => {
    flushKpis();
    flushCollabs();
    fixture.detectChanges();
    const text = el().textContent ?? '';
    [
      'Total Collaborations',
      'Pending Opportunities',
      'Pending Matchings',
      'Content to Submit',
      'Submission Deadline',
      'Content to Publish',
      'Publication Deadline',
      'Pending Payments',
      'Revenue Generated',
      'INFLU Score',
    ].forEach((label) => expect(text).toContain(label));
  });

  it('[AC-020-02] revenue is suffixed with "Dhs"', () => {
    flushKpis({ revenueGenerated: 1234 });
    flushCollabs();
    fixture.detectChanges();
    const revenue = el().querySelector('[data-testid="kpi-revenue"]')?.textContent ?? '';
    expect(revenue).toContain('1234');
    expect(revenue).toContain('Dhs');
  });

  it('[AC-021-01] Campaigns tab is selected by default with the 6 columns', () => {
    flushKpis();
    flushCollabs([
      {
        id: 'a1',
        brand: { id: 'b1', name: 'Brand 1' },
        campaign: { id: 'c1', name: 'Camp 1' },
        status: 'ACCEPTED',
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-02-01T00:00:00Z',
      },
    ]);
    fixture.detectChanges();
    const tab = el().querySelector('[data-testid="tab-campaigns"]')!;
    expect(tab.getAttribute('aria-selected')).toBe('true');
    const headers = Array.from(el().querySelectorAll('[data-testid="campaigns-table"] thead th')).map(
      (th) => th.textContent?.trim(),
    );
    expect(headers).toEqual(['Brand', 'Campaign', 'Status', 'Start Date', 'End Date', 'Actions']);
  });

  it('[AC-021-02] applying then clearing filters re-fetches collaborations', fakeAsync(() => {
    flushKpis();
    flushCollabs();
    fixture.detectChanges();
    const search = el().querySelector<HTMLInputElement>('[data-testid="filter-search"]')!;
    search.value = 'nike';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick();
    const reqWithQ = http.expectOne((r) => r.url === '/api/creator/me/collaborations' && r.params.get('q') === 'nike');
    reqWithQ.flush({ items: [], page: 1, limit: 20, total: 0 });

    el().querySelector<HTMLButtonElement>('[data-testid="filter-clear"]')!.click();
    fixture.detectChanges();
    tick();
    const reqClear = http.expectOne((r) => r.url === '/api/creator/me/collaborations' && !r.params.has('q'));
    reqClear.flush({ items: [], page: 1, limit: 20, total: 0 });
    fixture.detectChanges();
    expect(search.value).toBe('');
  }));

  it('[AC-021-03] empty state shows the EXACT text "No campaigns available at the moment."', () => {
    flushKpis();
    flushCollabs([]);
    fixture.detectChanges();
    const empty = el().querySelector('[data-testid="campaigns-empty"]');
    expect(empty?.textContent).toContain('No campaigns available at the moment.');
  });

  it('[AC-022-01] Pending Matchings shows "__" when null', () => {
    flushKpis({ pendingMatchings: null });
    flushCollabs();
    fixture.detectChanges();
    const v = el().querySelector('[data-testid="kpi-pending-matchings"]')?.textContent?.trim();
    expect(v).toBe('__');
  });

  it('[AC-022-01] Submission/Publication Deadline and INFLU Score show "__" when null', () => {
    flushKpis();
    flushCollabs();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="kpi-submission-deadline"]')?.textContent?.trim()).toBe('__');
    expect(el().querySelector('[data-testid="kpi-publication-deadline"]')?.textContent?.trim()).toBe('__');
    expect(el().querySelector('[data-testid="kpi-influ-score"]')?.textContent?.trim()).toBe('__');
  });

  it('switches to Marketplace tab when clicked', () => {
    flushKpis();
    flushCollabs();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="tab-marketplace"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="marketplace-tab-placeholder"]')).not.toBeNull();
  });

  it('shows error banner when collaborations API fails', () => {
    flushKpis();
    const req = http.expectOne((r) => r.url === '/api/creator/me/collaborations');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="campaigns-error"]')).not.toBeNull();
  });
});
