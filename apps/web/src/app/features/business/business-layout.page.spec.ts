import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessLayoutPage } from './business-layout.page';

describe('BusinessLayoutPage', () => {
  let fixture: ComponentFixture<BusinessLayoutPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessLayoutPage, TranslateModule.forRoot()],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessLayoutPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('[AC-101-01] global search input has the EXACT placeholder', () => {
    const input = el().querySelector<HTMLInputElement>('[data-testid="global-search-input"]')!;
    expect(input.getAttribute('placeholder')).toBe(
      'Search your best influencer by name or handle',
    );
    expect(input.getAttribute('role')).toBe('combobox');
    expect(el().querySelector('[data-testid="global-search-show"]')?.textContent).toContain(
      'Show suggestions',
    );
  });

  it('[AC-101-01] typing fetches suggestions and displays them', fakeAsync(() => {
    const input = el().querySelector<HTMLInputElement>('[data-testid="global-search-input"]')!;
    input.value = 'jane';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(250);
    const req = http.expectOne(
      (r) => r.url === '/api/business/discovery/creators' && r.params.get('q') === 'jane',
    );
    req.flush({
      items: [{ id: 'c1', name: 'Jane Doe', categories: [], engagementRate: 0, averageViews: 0, posts: 0, platforms: [] }],
      page: 1,
      limit: 8,
      total: 1,
      totalPages: 1,
    });
    fixture.detectChanges();
    const opts = el().querySelectorAll('[data-testid="global-search-option"]');
    expect(opts.length).toBe(1);
    expect(opts[0].textContent).toContain('Jane Doe');
  }));

  it('[AC-101-02] selecting a suggestion navigates to /business/profile/[id]', fakeAsync(() => {
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const input = el().querySelector<HTMLInputElement>('[data-testid="global-search-input"]')!;
    input.value = 'jane';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(250);
    http
      .expectOne((r) => r.url === '/api/business/discovery/creators')
      .flush({
        items: [
          {
            id: 'c1',
            name: 'Jane',
            categories: [],
            engagementRate: 0,
            averageViews: 0,
            posts: 0,
            platforms: [],
          },
        ],
        page: 1,
        limit: 8,
        total: 1,
        totalPages: 1,
      });
    fixture.detectChanges();
    el().querySelector<HTMLElement>('[data-testid="global-search-option"]')!.click();
    expect(spy).toHaveBeenCalledWith('/business/profile/c1');
  }));

  it('[AC-102-01] sidebar item "Social Listening" is visible but disabled', () => {
    const item = el().querySelector<HTMLAnchorElement>('[data-testid="nav-social-listening"]')!;
    expect(item).not.toBeNull();
    expect(item.classList.contains('disabled')).toBe(true);
    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect(item.textContent).toContain('Social Listening');
  });

  it('[AC-102-02] clicking Social Listening performs no navigation (preventDefault)', () => {
    const item = el().querySelector<HTMLAnchorElement>('[data-testid="nav-social-listening"]')!;
    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    item.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
