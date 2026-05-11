import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CreatorMarketplaceListPage } from './marketplace-list.page';

function makeCard(over: Partial<Record<string, unknown>> = {}): unknown {
  const base = {
    id: 'p1',
    brand: { id: 'b1', name: 'Eucerin' },
    compensationDhs: 4000,
    currency: 'MAD',
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    isExpired: false,
    platform: 'INSTAGRAM',
    productName: 'Eucerin Serum Oil Control',
    segmentTier: 'MICRO',
    slotsLeft: 22,
  };
  return { ...base, ...over };
}

describe('CreatorMarketplaceListPage', () => {
  let fixture: ComponentFixture<CreatorMarketplaceListPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorMarketplaceListPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorMarketplaceListPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushList(items: unknown[] = []): void {
    const req = http.expectOne((r) => r.url === '/api/v1/marketplace/products');
    req.flush({ items, page: 1, limit: 20, total: items.length });
  }

  it('[AC-030-01] displays opportunities as a vertical card grid', () => {
    flushList([makeCard(), makeCard({ id: 'p2', productName: 'Yassir Ride', brand: { id: 'b2', name: 'Yassir.ma' } })]);
    fixture.detectChanges();
    const cards = el().querySelectorAll('[data-testid="marketplace-card"]');
    expect(cards.length).toBe(2);
    expect(el().querySelector('[data-testid="marketplace-grid"]')).not.toBeNull();
  });

  it('[AC-030-01] each card shows brand, slots-left badge, segment tier, platform and "You will get up X Dhs"', () => {
    flushList([makeCard({ slotsLeft: 22, segmentTier: 'MICRO', compensationDhs: 4000 })]);
    fixture.detectChanges();
    const card = el().querySelector('[data-testid="marketplace-card"]')!;
    expect(card.textContent).toContain('Eucerin');
    expect(card.querySelector('[data-testid="badge-slots"]')?.textContent).toContain('22 Slot(s) Left');
    expect(card.textContent).toContain('for Micro');
    expect(card.textContent).toContain('Content Instagram');
    expect(card.querySelector('[data-testid="card-compensation"]')?.textContent?.replace(/\s+/g, ' ').trim()).toContain('You will get up 4 000 Dhs');
  });

  it('[AC-035-01] non-expired card shows "Expires in N days" badge', () => {
    flushList([makeCard()]);
    fixture.detectChanges();
    const badge = el().querySelector('[data-testid="badge-expires"]');
    expect(badge?.textContent).toContain('Expires in');
    expect(badge?.textContent).toContain('day');
  });

  it('[AC-035-02] expired card shows the EXACT "Expired" badge', () => {
    flushList([makeCard({ isExpired: true })]);
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="badge-expired"]')?.textContent?.trim()).toBe('Expired');
  });

  it('[AC-030-02] search refetches with q=, Clear restores full grid', fakeAsync(() => {
    flushList([makeCard()]);
    fixture.detectChanges();
    const search = el().querySelector<HTMLInputElement>('[data-testid="filter-search"]')!;
    search.value = 'eucerin';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick();
    http.expectOne((r) => r.url === '/api/v1/marketplace/products' && r.params.get('q') === 'eucerin').flush({ items: [], page: 1, limit: 20, total: 0 });
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="filter-clear"]')!.click();
    fixture.detectChanges();
    tick();
    http.expectOne((r) => r.url === '/api/v1/marketplace/products' && !r.params.has('q')).flush({ items: [makeCard()], page: 1, limit: 20, total: 1 });
    fixture.detectChanges();
    expect(search.value).toBe('');
    expect(el().querySelectorAll('[data-testid="marketplace-card"]').length).toBe(1);
  }));

  it('[AC-030-03] empty state shows the EXACT "No products found in your marketplace"', () => {
    flushList([]);
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="marketplace-empty"]')?.textContent).toContain('No products found in your marketplace');
  });

  it('shows error banner when API fails', () => {
    const req = http.expectOne((r) => r.url === '/api/v1/marketplace/products');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="marketplace-error"]')).not.toBeNull();
  });
});

