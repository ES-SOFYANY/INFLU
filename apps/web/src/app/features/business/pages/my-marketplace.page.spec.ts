import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { BusinessMyMarketplacePage } from './my-marketplace.page';

function product(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    productName: 'Serum',
    brand: { id: 'b1', name: 'Eucerin' },
    segmentTier: 'MICRO',
    slotsLeft: 5,
    expiresAt: '2026-06-01T00:00:00.000Z',
    isExpired: false,
    platform: 'INSTAGRAM',
    compensationDhs: 4000,
    currency: 'MAD',
    ...overrides,
  };
}

describe('BusinessMyMarketplacePage', () => {
  let fixture: ComponentFixture<BusinessMyMarketplacePage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessMyMarketplacePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessMyMarketplacePage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/business/brands').flush([{ id: 'b1', name: 'Eucerin' }]);
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushProducts(items: ReadonlyArray<unknown>): void {
    const req = http.expectOne((r) => r.url === '/api/business/marketplace/products');
    req.flush({ items, total: items.length, page: 1, limit: 10 });
    fixture.detectChanges();
  }

  it('[AC-122-01] lists products with all expected columns', () => {
    flushProducts([product('p1'), product('p2', { isExpired: true })]);
    const table = el().querySelector('[data-testid="products-table"]');
    expect(table).toBeTruthy();
    const headers = Array.from(table!.querySelectorAll('thead th')).map((h) => h.textContent?.trim());
    expect(headers).toEqual([
      'Product',
      'Brand',
      'Tier',
      'Slots',
      'Status',
      'Expires',
      'Actions',
    ]);
    expect(table!.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('shows empty state when no products exist', () => {
    flushProducts([]);
    expect(el().querySelector('[data-testid="empty"]')).toBeTruthy();
  });

  it('[AC-122-02] product link points to creator-side detail (/creator/marketplace/{id})', () => {
    flushProducts([product('p1')]);
    const link = el().querySelector<HTMLAnchorElement>('[data-testid="product-link-p1"]');
    expect(link?.getAttribute('href')).toBe('/creator/marketplace/p1');
  });

  it('Edit relaunches the wizard with id query param', () => {
    flushProducts([product('p1')]);
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate');
    el().querySelector<HTMLButtonElement>('[data-testid="edit-p1"]')!.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/business/marketplace/create'], { queryParams: { id: 'p1' } });
  });

  it('Delete opens confirmation modal and calls DELETE on confirm', () => {
    flushProducts([product('p1')]);
    el().querySelector<HTMLButtonElement>('[data-testid="delete-p1"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="delete-modal"]')).toBeTruthy();

    el().querySelector<HTMLButtonElement>('[data-testid="delete-confirm"]')!.click();
    fixture.detectChanges();
    const req = http.expectOne('/api/business/marketplace/products/p1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="delete-modal"]')).toBeNull();
    expect(el().querySelector('[data-testid="empty"]')).toBeTruthy();
  });

  it('Cancel in delete modal closes without calling DELETE', () => {
    flushProducts([product('p1')]);
    el().querySelector<HTMLButtonElement>('[data-testid="delete-p1"]')!.click();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="delete-cancel"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="delete-modal"]')).toBeNull();
    http.expectNone('/api/business/marketplace/products/p1');
  });

  it('Brand + Status filters propagate to query params', () => {
    flushProducts([]);
    const brandSelect = el().querySelector<HTMLSelectElement>('[data-testid="filter-brand"]')!;
    brandSelect.value = brandSelect.options[1].value;
    brandSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    let req = http.expectOne((r) => r.url === '/api/business/marketplace/products');
    expect(req.request.params.get('brand')).toBe('b1');
    req.flush({ items: [], total: 0, page: 1, limit: 10 });

    const statusSelect = el().querySelector<HTMLSelectElement>('[data-testid="filter-status"]')!;
    statusSelect.value = 'PUBLISHED';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    req = http.expectOne((r) => r.url === '/api/business/marketplace/products');
    expect(req.request.params.get('status')).toBe('PUBLISHED');
    req.flush({ items: [], total: 0, page: 1, limit: 10 });
  });

  it('shows error banner when products fetch fails', () => {
    http
      .expectOne((r) => r.url === '/api/business/marketplace/products')
      .flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="error"]')).toBeTruthy();
  });
});
