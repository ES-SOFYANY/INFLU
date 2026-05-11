import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CreatorMessagingPage } from './messaging.page';

function makeConv(over: Partial<Record<string, unknown>> = {}): unknown {
  return {
    id: 'conv-1',
    profile: { id: 'b-1', name: 'NUXE' },
    campaign: { id: 'cmp-1', name: 'NUXE Reve de Miel' },
    lastMessage: { content: 'Brief sent', createdAt: '2025-01-01T10:00:00.000Z' },
    status: 'OPEN',
    ...over,
  };
}

describe('CreatorMessagingPage', () => {
  let fixture: ComponentFixture<CreatorMessagingPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorMessagingPage],
      providers: [
        provideRouter([{ path: 'creator/messaging', component: CreatorMessagingPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorMessagingPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushList(items: unknown[] = [], total = items.length): void {
    http.expectOne((r) => r.url === '/api/v1/messaging/conversations').flush({
      items,
      page: 1,
      limit: 20,
      total,
    });
    fixture.detectChanges();
  }

  it('[AC-061-01] empty state displays the EXACT text', () => {
    flushList([]);
    const empty = el().querySelector('[data-testid="msg-empty"]');
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toContain("You don't have any open discussions at the moment.");
  });

  it('[AC-061-02] no filter is pre-applied on first arrival', () => {
    const req = http.expectOne((r) => r.url === '/api/v1/messaging/conversations');
    expect(req.request.params.has('q')).toBe(false);
    expect(req.request.params.has('brand')).toBe(false);
    expect(req.request.params.has('status')).toBe(false);
    req.flush({ items: [], page: 1, limit: 20, total: 0 });
  });

  it('[AC-060-01] table exposes Profile / Campaign / Last Message / Actions and three filters', () => {
    flushList([makeConv()]);
    const headers = Array.from(el().querySelectorAll('[data-testid="msg-table"] thead th')).map(
      (h) => h.textContent?.trim(),
    );
    expect(headers).toEqual(['Profile', 'Campaign', 'Last Message', 'Actions']);
    expect(el().querySelector('[data-testid="msg-search"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="msg-brand"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="msg-status"]')).not.toBeNull();
  });

  it('[AC-060-02] opening a conversation reveals the chat detail panel', () => {
    flushList([makeConv()]);
    el().querySelector<HTMLButtonElement>('[data-testid="msg-open"]')!.click();
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/messaging/conversations/conv-1/messages').flush({
      items: [
        { id: 'm-1', conversationId: 'conv-1', senderId: 'me', content: 'Hi', createdAt: '' },
      ],
      page: 1,
      limit: 100,
      total: 1,
    });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="msg-detail"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="msg-bubble"]')?.textContent).toContain('Hi');
  });

  it('[AC-060-01] sending an empty message is blocked (validation)', () => {
    flushList([makeConv()]);
    el().querySelector<HTMLButtonElement>('[data-testid="msg-open"]')!.click();
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/messaging/conversations/conv-1/messages').flush({
      items: [],
      page: 1,
      limit: 100,
      total: 0,
    });
    fixture.detectChanges();
    const send = el().querySelector<HTMLButtonElement>('[data-testid="msg-send"]')!;
    expect(send.disabled).toBe(true);
  });

  it('[AC-060-01] sending a non-empty message POSTs to the backend', fakeAsync(() => {
    flushList([makeConv()]);
    el().querySelector<HTMLButtonElement>('[data-testid="msg-open"]')!.click();
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/messaging/conversations/conv-1/messages').flush({
      items: [],
      page: 1,
      limit: 100,
      total: 0,
    });
    fixture.detectChanges();
    const input = el().querySelector<HTMLInputElement>('[data-testid="msg-input"]')!;
    input.value = 'Hello brand';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLFormElement>('[data-testid="msg-detail"] form')!.dispatchEvent(
      new Event('submit'),
    );
    tick();
    const post = http.expectOne(
      (r) => r.method === 'POST' && r.url === '/api/v1/messaging/conversations/conv-1/messages',
    );
    expect(post.request.body).toEqual({ content: 'Hello brand' });
    post.flush({
      id: 'm-2',
      conversationId: 'conv-1',
      senderId: 'me',
      content: 'Hello brand',
      createdAt: '',
    });
    fixture.detectChanges();
  }));

  it('[AC-060-01] backend error on list shows an inline error', () => {
    http.expectOne((r) => r.url === '/api/v1/messaging/conversations').error(
      new ProgressEvent('error'),
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="msg-list-error"]')).not.toBeNull();
  });
});
