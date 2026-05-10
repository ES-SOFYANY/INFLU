import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { BusinessDiscoveryPage } from './discovery.page';

function makeCreator(over: Partial<Record<string, unknown>> = {}): unknown {
  return {
    id: 'cr-1',
    name: 'Ali',
    avatarUrl: undefined,
    averageViews: 180000,
    categories: ['Motorsports', 'Lifestyle'],
    country: 'MA',
    engagementRate: 4.2,
    gender: 'M',
    mainCategory: 'Motorsports',
    platforms: [
      { platform: 'INSTAGRAM', followers: 1930000 },
      { platform: 'YOUTUBE', followers: 50000 },
    ],
    posts: 240,
    ...over,
  };
}

describe('BusinessDiscoveryPage', () => {
  let fixture: ComponentFixture<BusinessDiscoveryPage>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessDiscoveryPage],
      providers: [
        provideRouter([{ path: 'business/discovery', component: BusinessDiscoveryPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessDiscoveryPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flush(items: unknown[] = [makeCreator()], total = 1): void {
    http.expectOne((r) => r.url === '/api/business/discovery/creators').flush({
      items,
      page: 1,
      limit: 20,
      total,
    });
    fixture.detectChanges();
  }

  it('[AC-131-01] Table View is selected by default', () => {
    flush();
    const table = el().querySelector<HTMLButtonElement>('[data-testid="view-table"]')!;
    const grid = el().querySelector<HTMLButtonElement>('[data-testid="view-grid"]')!;
    expect(table.getAttribute('aria-pressed')).toBe('true');
    expect(grid.getAttribute('aria-pressed')).toBe('false');
    expect(el().querySelector('[data-testid="discovery-table"]')).not.toBeNull();
  });

  it('[AC-131-02] switching to Grid View renders cards instead of the table', () => {
    flush();
    el().querySelector<HTMLButtonElement>('[data-testid="view-grid"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="discovery-grid"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="discovery-table"]')).toBeNull();
  });

  it('[AC-131-03] pagination summary shows "Page X of Y (Total Z records)"', () => {
    flush([makeCreator()], 577);
    expect(el().querySelector('[data-testid="pagination-summary"]')?.textContent).toContain(
      'Page 1 of 29 (Total 577 records)',
    );
  });

  it('[AC-130-02] Reset (N) shows the active filter count and clears them', fakeAsync(() => {
    flush();
    const q = el().querySelector<HTMLInputElement>('[data-testid="filter-q"]')!;
    q.value = 'beauty';
    q.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick();
    http
      .expectOne((r) => r.url === '/api/business/discovery/creators' && r.params.get('q') === 'beauty')
      .flush({ items: [], page: 1, limit: 20, total: 0 });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="filter-reset"]')?.textContent).toContain('Reset (1)');

    el().querySelector<HTMLButtonElement>('[data-testid="filter-reset"]')!.click();
    fixture.detectChanges();
    tick();
    http
      .expectOne((r) => r.url === '/api/business/discovery/creators' && !r.params.has('q'))
      .flush({ items: [makeCreator()], page: 1, limit: 20, total: 1 });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="filter-reset"]')?.textContent).toContain('Reset (0)');
  }));

  it('[AC-130-01] persists filter to URL via disc_filter, disc_seed, disc_page', fakeAsync(() => {
    flush();
    const navSpy = spyOn(router, 'navigate').and.callThrough();
    const q = el().querySelector<HTMLInputElement>('[data-testid="filter-q"]')!;
    q.value = 'beauty';
    q.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick();
    http
      .expectOne((r) => r.url === '/api/business/discovery/creators' && r.params.get('q') === 'beauty')
      .flush({ items: [], page: 1, limit: 20, total: 0 });
    expect(navSpy).toHaveBeenCalled();
    const call = navSpy.calls.mostRecent();
    const queryParams = call.args[1]?.queryParams as Record<string, string>;
    expect(queryParams['disc_filter']).toBeDefined();
    expect(queryParams['disc_seed']).toBeDefined();
    expect(queryParams['disc_page']).toBe('1');
    const decoded = JSON.parse(decodeURIComponent(queryParams['disc_filter']));
    expect(decoded.q).toBe('beauty');
  }));

  it('[AC-130-03] Filter Options drawer opens on click', () => {
    flush();
    expect(el().querySelector('[data-testid="filter-drawer"]')).toBeNull();
    el().querySelector<HTMLButtonElement>('[data-testid="filter-options"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="filter-drawer"]')).not.toBeNull();
  });

  it('table renders the 8 columns (Name, Categories, Country, Platforms, Engagement %, Posts, Views, Actions)', () => {
    flush();
    const headers = Array.from(el().querySelectorAll('[data-testid="discovery-table"] thead th')).map(
      (th) => th.textContent?.trim(),
    );
    expect(headers).toEqual([
      'Name',
      'Categories',
      'Country',
      'Platforms',
      'Engagement %',
      'Posts',
      'Views',
      'Actions',
    ]);
  });

  it('shows error banner when API fails', () => {
    http
      .expectOne((r) => r.url === '/api/business/discovery/creators')
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="discovery-error"]')).not.toBeNull();
  });
});

