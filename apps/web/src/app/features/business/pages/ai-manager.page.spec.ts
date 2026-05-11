import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BusinessAiManagerPage } from './ai-manager.page';

describe('BusinessAiManagerPage', () => {
  let fixture: ComponentFixture<BusinessAiManagerPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessAiManagerPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessAiManagerPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushBrands(items: ReadonlyArray<{ id: string; name: string }> = []): void {
    http.expectOne('/api/v1/business/brands').flush(items);
  }

  function flushCampaigns(items: ReadonlyArray<unknown> = []): void {
    const req = http.expectOne((r) => r.url === '/api/v1/business/ai-campaigns');
    req.flush({ items, total: items.length, page: 1, totalPages: 1, limit: 10 });
  }

  it('[AC-111-01] shows EXACT empty state and CTA "Create AI campaign"', () => {
    flushBrands();
    flushCampaigns([]);
    fixture.detectChanges();
    const empty = el().querySelector('[data-testid="empty"]');
    expect(empty).toBeTruthy();
    expect(empty?.querySelector('.empty-title')?.textContent).toBe('No AI campaigns created yet');
    const cta = el().querySelector<HTMLAnchorElement>('[data-testid="cta-create"]');
    expect(cta?.getAttribute('href')).toBe('/business/ai-campaign');
    expect(cta?.textContent).toContain('Create AI campaign');
  });

  it('[AC-111-02] Search filter triggers refetch with q', () => {
    flushBrands();
    flushCampaigns([]);
    fixture.detectChanges();
    const input = el().querySelector<HTMLInputElement>('[data-testid="filter-search"]')!;
    input.value = 'launch';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/v1/business/ai-campaigns');
    expect(req.request.params.get('q')).toBe('launch');
    req.flush({ items: [], total: 0, page: 1, totalPages: 0, limit: 10 });
  });

  it('[AC-111-02] Status filter triggers refetch with status', () => {
    flushBrands();
    flushCampaigns([]);
    fixture.detectChanges();
    const select = el().querySelector<HTMLSelectElement>('[data-testid="filter-status"]')!;
    select.value = select.options[1].value; // first real status
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/v1/business/ai-campaigns');
    expect(req.request.params.get('status')).toBe('DRAFT');
    req.flush({ items: [], total: 0, page: 1, totalPages: 0, limit: 10 });
  });

  it('[AC-111-02] Clear resets the filters', () => {
    flushBrands();
    flushCampaigns([]);
    fixture.detectChanges();
    const input = el().querySelector<HTMLInputElement>('[data-testid="filter-search"]')!;
    input.value = 'foo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/business/ai-campaigns').flush({
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
      limit: 10,
    });

    el().querySelector<HTMLButtonElement>('[data-testid="filter-clear"]')!.click();
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/v1/business/ai-campaigns');
    expect(req.request.params.get('q')).toBeNull();
    expect(req.request.params.get('status')).toBeNull();
    req.flush({ items: [], total: 0, page: 1, totalPages: 0, limit: 10 });
  });

  it('renders the table with the expected columns when campaigns exist', () => {
    flushBrands([{ id: 'b1', name: 'Eucerin' }]);
    flushCampaigns([
      {
        id: 'c1',
        brandId: 'b1',
        name: 'Spring launch',
        source: 'AI_CAMPAIGN',
        status: 'ACTIVE',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
    ]);
    fixture.detectChanges();
    const table = el().querySelector('[data-testid="campaigns-table"]');
    expect(table).toBeTruthy();
    const headers = Array.from(table!.querySelectorAll('thead th')).map((h) => h.textContent?.trim());
    expect(headers).toEqual(['Brand', 'Campaign', 'Status', 'Start Date', 'End Date', 'Actions']);
    expect(table!.querySelector('tbody tr')?.textContent).toContain('Eucerin');
    expect(table!.querySelector('tbody tr')?.textContent).toContain('Spring launch');
  });

  it('shows API error banner when campaigns request fails', () => {
    flushBrands();
    http
      .expectOne((r) => r.url === '/api/v1/business/ai-campaigns')
      .flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="error"]')).toBeTruthy();
  });
});
