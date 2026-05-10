import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { NotificationsBellComponent } from './notifications-bell.component';

function notif(
  id: string,
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id,
    type: 'MESSAGE_RECEIVED',
    title: 'New message',
    message: 'You have a new message from Eucerin',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    link: '/business/messaging',
    ...overrides,
  };
}

describe('NotificationsBellComponent (US-204)', () => {
  let fixture: ComponentFixture<NotificationsBellComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsBellComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationsBellComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function clickBell(): void {
    el().querySelector<HTMLButtonElement>('[data-testid="notifications-bell"]')!.click();
    fixture.detectChanges();
  }

  it('renders the bell with aria-label="Notifications" and does NOT fetch on init', () => {
    const btn = el().querySelector('[aria-label="Notifications"]');
    expect(btn).not.toBeNull();
    http.expectNone((r) => r.url === '/api/notifications');
  });

  it('[AC-204-01] opens panel on click and lists last notifications (limit=10, unreadOnly=false)', () => {
    clickBell();
    const req = http.expectOne(
      (r) =>
        r.url === '/api/notifications' &&
        r.params.get('limit') === '10' &&
        r.params.get('unreadOnly') === 'false',
    );
    req.flush({
      items: [notif('n1', { type: 'PAYMENT_RECEIVED', title: 'Payment received' })],
      page: 1,
      limit: 10,
      total: 1,
      unreadCount: 1,
    });
    fixture.detectChanges();

    const panel = el().querySelector('[data-testid="notifications-panel"]');
    expect(panel).toBeTruthy();
    const item = el().querySelector('[data-testid="notifications-item-n1"]');
    expect(item).toBeTruthy();
    expect(item!.textContent).toContain('Payment received');
    expect(item!.textContent).toContain('You have a new message');
    expect(el().querySelector('[data-testid="notifications-item-type"]')!.textContent!.trim())
      .toBe('Payment Received');
    expect(el().querySelector('[data-testid="notifications-unread-badge"]')!.textContent!.trim()).toBe(
      '1',
    );
  });

  it('[AC-204-02] clicking a notification marks it read and navigates to its link', () => {
    clickBell();
    http.expectOne((r) => r.url === '/api/notifications').flush({
      items: [notif('n1', { isRead: false, link: '/business/messaging' })],
      page: 1,
      limit: 10,
      total: 1,
      unreadCount: 1,
    });
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    el().querySelector<HTMLButtonElement>('[data-testid="notifications-item-n1"]')!.click();
    fixture.detectChanges();

    const post = http.expectOne('/api/notifications/n1/read');
    expect(post.request.method).toBe('POST');
    post.flush(null);
    expect(navSpy).toHaveBeenCalledWith('/business/messaging');
  });

  it('does not navigate when notification has no link', () => {
    clickBell();
    http.expectOne((r) => r.url === '/api/notifications').flush({
      items: [notif('n1', { link: undefined, isRead: false })],
      page: 1,
      limit: 10,
      total: 1,
      unreadCount: 1,
    });
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigateByUrl');
    el().querySelector<HTMLButtonElement>('[data-testid="notifications-item-n1"]')!.click();
    fixture.detectChanges();
    http.expectOne('/api/notifications/n1/read').flush(null);
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows empty state when no notifications', () => {
    clickBell();
    http.expectOne((r) => r.url === '/api/notifications').flush({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      unreadCount: 0,
    });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="notifications-empty"]')).toBeTruthy();
  });

  it('shows error banner when list fails', () => {
    clickBell();
    http
      .expectOne((r) => r.url === '/api/notifications')
      .flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="notifications-error"]')).toBeTruthy();
  });

  it('"Mark all as read" sends POST for each unread and clears the badge', () => {
    clickBell();
    http.expectOne((r) => r.url === '/api/notifications').flush({
      items: [
        notif('n1', { isRead: false }),
        notif('n2', { isRead: false }),
        notif('n3', { isRead: true }),
      ],
      page: 1,
      limit: 10,
      total: 3,
      unreadCount: 2,
    });
    fixture.detectChanges();
    el()
      .querySelector<HTMLButtonElement>('[data-testid="notifications-mark-all-read"]')!
      .click();
    fixture.detectChanges();
    http.expectOne('/api/notifications/n1/read').flush(null);
    http.expectOne('/api/notifications/n2/read').flush(null);
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="notifications-unread-badge"]')).toBeNull();
  });
});
