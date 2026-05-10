import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BusinessMessagingPage } from './messaging.page';

describe('BusinessMessagingPage', () => {
  let fixture: ComponentFixture<BusinessMessagingPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessMessagingPage],
      providers: [
        provideRouter([{ path: 'business/messaging', component: BusinessMessagingPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessMessagingPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('[AC-150-01] table exposes Profile / Campaign / Last Message / Actions and three filters', () => {
    http.expectOne((r) => r.url === '/api/messaging/conversations').flush({
      items: [
        {
          id: 'c-1',
          profile: { id: 'cr-1', name: 'Ali' },
          campaign: { id: 'k', name: 'Eucerin' },
          lastMessage: { content: 'Hi', createdAt: '' },
          status: 'OPEN',
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    });
    fixture.detectChanges();
    const headers = Array.from(el().querySelectorAll('[data-testid="msg-table"] thead th')).map(
      (h) => h.textContent?.trim(),
    );
    expect(headers).toEqual(['Profile', 'Campaign', 'Last Message', 'Actions']);
    expect(el().querySelector('[data-testid="msg-search"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="msg-brand"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="msg-status"]')).not.toBeNull();
  });

  it('[AC-150-01] empty state displays the EXACT text', () => {
    http
      .expectOne((r) => r.url === '/api/messaging/conversations')
      .flush({ items: [], page: 1, limit: 20, total: 0 });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="msg-empty"]')?.textContent).toContain(
      "You don't have any open discussions at the moment.",
    );
  });

  it('[AC-150-01] backend error renders an inline alert', () => {
    http
      .expectOne((r) => r.url === '/api/messaging/conversations')
      .error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="msg-list-error"]')).not.toBeNull();
  });
});
