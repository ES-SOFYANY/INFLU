import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BusinessDashboardPage } from './dashboard.page';

describe('BusinessDashboardPage', () => {
  let fixture: ComponentFixture<BusinessDashboardPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessDashboardPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessDashboardPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushKpis(overrides: Partial<Record<string, unknown>> = {}): void {
    const req = http.expectOne('/api/business/me/dashboard-kpis');
    req.flush({
      numberOfCampaigns: 0,
      active: 0,
      draft: 0,
      onHold: 0,
      completed: 0,
      currency: 'MAD',
      ...overrides,
    });
  }

  function flushBrands(items: unknown[] = []): void {
    const req = http.expectOne('/api/business/brands');
    req.flush(items);
  }

  function flushCampaigns(items: unknown[] = []): void {
    const req = http.expectOne((r) => r.url === '/api/business/ai-campaigns');
    req.flush({ items, page: 1, limit: 20, total: items.length });
  }

  it('[AC-100-01] renders the 5 KPI cards with the EXACT labels', () => {
    flushKpis({ numberOfCampaigns: 4, active: 2, draft: 1, onHold: 0, completed: 1 });
    flushBrands();
    flushCampaigns();
    fixture.detectChanges();
    const text = el().textContent ?? '';
    ['Number of campaigns', 'Active', 'Draft', 'On hold', 'Completed'].forEach((label) =>
      expect(text).toContain(label),
    );
    expect(el().querySelector('[data-testid="kpi-total"]')?.textContent?.trim()).toBe('4');
    expect(el().querySelector('[data-testid="kpi-active"]')?.textContent?.trim()).toBe('2');
  });

  it('[AC-100-01] CTA "New AI campaign" and the two tabs are present', () => {
    flushKpis();
    flushBrands();
    flushCampaigns();
    fixture.detectChanges();
    const cta = el().querySelector('[data-testid="cta-new-ai-campaign"]');
    expect(cta?.textContent).toContain('New AI campaign');
    const tabs = el().querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);
    expect(el().querySelector('[data-testid="tab-campaigns"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(el().querySelector('[data-testid="tab-marketplace"]')?.textContent).toContain(
      'Marketplace',
    );
  });

  it('[AC-100-02] empty state shows the EXACT text "No campaigns created yet."', () => {
    flushKpis();
    flushBrands();
    flushCampaigns([]);
    fixture.detectChanges();
    const empty = el().querySelector('[data-testid="campaigns-empty"]');
    expect(empty?.textContent).toContain('No campaigns created yet.');
  });

  it('[AC-100-01] Campaigns table renders the 6 columns when there are campaigns', () => {
    flushKpis();
    flushBrands([{ id: 'b1', name: 'Brand 1', accessControl: { members: 1, myRole: 'OWNER' } }]);
    flushCampaigns([
      {
        id: 'c1',
        name: 'Camp 1',
        brandId: 'b1',
        source: 'AI_CAMPAIGN',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      },
    ]);
    fixture.detectChanges();
    const headers = Array.from(el().querySelectorAll('[data-testid="campaigns-table"] thead th')).map(
      (th) => th.textContent?.trim(),
    );
    expect(headers).toEqual(['Brand', 'Campaign', 'Status', 'Start Date', 'End Date', 'Actions']);
  });

  it('search filter triggers a re-fetch with q=', fakeAsync(() => {
    flushKpis();
    flushBrands();
    flushCampaigns();
    fixture.detectChanges();
    const search = el().querySelector<HTMLInputElement>('[data-testid="filter-search"]')!;
    search.value = 'nuxe';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick();
    const req = http.expectOne(
      (r) => r.url === '/api/business/ai-campaigns' && r.params.get('q') === 'nuxe',
    );
    req.flush({ items: [], page: 1, limit: 20, total: 0 });
  }));

  it('clear button resets all filters', fakeAsync(() => {
    flushKpis();
    flushBrands();
    flushCampaigns();
    fixture.detectChanges();
    const search = el().querySelector<HTMLInputElement>('[data-testid="filter-search"]')!;
    search.value = 'x';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick();
    http
      .expectOne((r) => r.url === '/api/business/ai-campaigns' && r.params.get('q') === 'x')
      .flush({ items: [], page: 1, limit: 20, total: 0 });
    el().querySelector<HTMLButtonElement>('[data-testid="filter-clear"]')!.click();
    fixture.detectChanges();
    tick();
    http
      .expectOne((r) => r.url === '/api/business/ai-campaigns' && !r.params.has('q'))
      .flush({ items: [], page: 1, limit: 20, total: 0 });
    expect(search.value).toBe('');
  }));

  it('switches to Marketplace tab when clicked', () => {
    flushKpis();
    flushBrands();
    flushCampaigns();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="tab-marketplace"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="marketplace-tab-placeholder"]')).not.toBeNull();
  });

  it('shows error banner when campaigns API fails', () => {
    flushKpis();
    flushBrands();
    const req = http.expectOne((r) => r.url === '/api/business/ai-campaigns');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="campaigns-error"]')).not.toBeNull();
  });
});
