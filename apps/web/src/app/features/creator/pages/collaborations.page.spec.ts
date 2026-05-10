import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CreatorCollaborationsPage } from './collaborations.page';

describe('CreatorCollaborationsPage', () => {
  let fixture: ComponentFixture<CreatorCollaborationsPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorCollaborationsPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorCollaborationsPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flush(items: unknown[] = []): void {
    http.expectOne((r) => r.url === '/api/creator/me/collaborations').flush({
      items,
      page: 1,
      limit: 20,
      total: items.length,
    });
    fixture.detectChanges();
  }

  it('[AC-040-01] renders the same 6 columns as the dashboard Campaigns tab', () => {
    flush([
      {
        id: 'c1',
        brand: { id: 'b1', name: 'Eucerin' },
        campaign: { id: 'cmp', name: 'Oil Control Serum' },
        status: 'APPLIED',
        startDate: '2026-04-21T00:00:00Z',
        endDate: '2026-04-24T00:00:00Z',
      },
    ]);
    const headers = Array.from(el().querySelectorAll('[data-testid="collab-table"] thead th')).map(
      (th) => th.textContent?.trim(),
    );
    expect(headers).toEqual(['Brand', 'Campaign', 'Status', 'Start Date', 'End Date', 'Actions']);
  });

  it('[AC-040-02] empty state shows the EXACT "No campaigns available at the moment."', () => {
    flush([]);
    expect(el().querySelector('[data-testid="collab-empty"]')?.textContent).toContain(
      'No campaigns available at the moment.',
    );
  });

  it('search filter triggers a re-fetch with q=', fakeAsync(() => {
    flush();
    const search = el().querySelector<HTMLInputElement>('[data-testid="filter-search"]')!;
    search.value = 'eucerin';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick();
    http
      .expectOne((r) => r.url === '/api/creator/me/collaborations' && r.params.get('q') === 'eucerin')
      .flush({ items: [], page: 1, limit: 20, total: 0 });
  }));

  it('shows error banner when API fails', () => {
    http
      .expectOne((r) => r.url === '/api/creator/me/collaborations')
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="collab-error"]')).not.toBeNull();
  });
});

