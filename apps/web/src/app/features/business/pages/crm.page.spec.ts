import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BusinessCrmPage } from './crm.page';

function makeList(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'l-1',
    title: 'Beauty MA Q2',
    description: 'Beauty creators in Morocco',
    creatorsCount: 3,
    createdAt: '2025-01-01T10:00:00.000Z',
    ...over,
  };
}

describe('BusinessCrmPage', () => {
  let fixture: ComponentFixture<BusinessCrmPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessCrmPage],
      providers: [
        provideRouter([{ path: 'business/crm', component: BusinessCrmPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessCrmPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushList(items: unknown[] = [], total = items.length): void {
    http.expectOne((r) => r.url === '/api/business/crm/lists').flush({
      items,
      page: 1,
      limit: 50,
      total,
    });
    fixture.detectChanges();
  }

  it('[AC-140-01] empty state shows the EXACT text + Create New CRM button', () => {
    flushList([]);
    const empty = el().querySelector('[data-testid="crm-empty"]');
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toContain('No CRM list has been created yet.');
    expect(el().querySelector('[data-testid="crm-create-empty"]')).not.toBeNull();
  });

  it('[AC-140-02] search filters the lists via the q query param', fakeAsync(() => {
    flushList([makeList()]);
    const input = el().querySelector<HTMLInputElement>('[data-testid="crm-search"]')!;
    input.value = 'beauty';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick();
    const req = http.expectOne(
      (r) => r.url === '/api/business/crm/lists' && r.params.get('q') === 'beauty',
    );
    req.flush({ items: [makeList()], page: 1, limit: 50, total: 1 });
    fixture.detectChanges();
    expect(el().querySelectorAll('[data-testid="crm-card"]').length).toBe(1);
  }));

  it('[AC-141-01] clicking Create opens a modal with Title and Description and Cancel/Create CRM buttons', () => {
    flushList([]);
    el().querySelector<HTMLButtonElement>('[data-testid="crm-create"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="crm-modal"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="crm-modal-title-input"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="crm-modal-desc-input"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="crm-modal-cancel"]')).not.toBeNull();
    const submit = el().querySelector('[data-testid="crm-modal-submit"]');
    expect(submit?.textContent?.trim()).toBe('Create CRM');
  });

  it('[AC-141-02] submitting the modal POSTs and reloads the list', fakeAsync(() => {
    flushList([]);
    el().querySelector<HTMLButtonElement>('[data-testid="crm-create"]')!.click();
    fixture.detectChanges();
    const titleInput = el().querySelector<HTMLInputElement>(
      '[data-testid="crm-modal-title-input"]',
    )!;
    titleInput.value = 'Beauty MA Q2';
    titleInput.dispatchEvent(new Event('input'));
    const descInput = el().querySelector<HTMLTextAreaElement>(
      '[data-testid="crm-modal-desc-input"]',
    )!;
    descInput.value = 'Beauty creators in Morocco';
    descInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="crm-modal-submit"]')!.click();
    tick();
    const post = http.expectOne(
      (r) => r.method === 'POST' && r.url === '/api/business/crm/lists',
    );
    expect(post.request.body).toEqual({
      title: 'Beauty MA Q2',
      description: 'Beauty creators in Morocco',
    });
    post.flush(makeList());
    fixture.detectChanges();
    flushList([makeList()]);
    expect(el().querySelector('[data-testid="crm-modal"]')).toBeNull();
    expect(el().querySelectorAll('[data-testid="crm-card"]').length).toBe(1);
  }));

  it('[AC-141-01] modal blocks submit while title or description are empty', () => {
    flushList([]);
    el().querySelector<HTMLButtonElement>('[data-testid="crm-create"]')!.click();
    fixture.detectChanges();
    const submit = el().querySelector<HTMLButtonElement>('[data-testid="crm-modal-submit"]')!;
    expect(submit.disabled).toBe(true);
  });

  it('[AC-141-02] kebab → Edit pre-fills the modal and PUTs', fakeAsync(() => {
    flushList([makeList()]);
    el().querySelector<HTMLButtonElement>('[data-testid="crm-kebab"]')!.click();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="crm-edit"]')!.click();
    fixture.detectChanges();
    const titleInput = el().querySelector<HTMLInputElement>(
      '[data-testid="crm-modal-title-input"]',
    )!;
    expect(titleInput.value).toBe('Beauty MA Q2');
    titleInput.value = 'Beauty MA Q3';
    titleInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="crm-modal-submit"]')!.click();
    tick();
    const put = http.expectOne(
      (r) => r.method === 'PUT' && r.url === '/api/business/crm/lists/l-1',
    );
    expect(put.request.body).toEqual({
      title: 'Beauty MA Q3',
      description: 'Beauty creators in Morocco',
    });
    put.flush(makeList({ title: 'Beauty MA Q3' }));
    fixture.detectChanges();
    flushList([makeList({ title: 'Beauty MA Q3' })]);
  }));

  it('[AC-141-02] kebab → Delete sends DELETE and reloads', () => {
    flushList([makeList()]);
    spyOn(window, 'confirm').and.returnValue(true);
    el().querySelector<HTMLButtonElement>('[data-testid="crm-kebab"]')!.click();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="crm-delete"]')!.click();
    http.expectOne((r) => r.method === 'DELETE' && r.url === '/api/business/crm/lists/l-1').flush(
      null,
    );
    fixture.detectChanges();
    flushList([]);
    expect(el().querySelector('[data-testid="crm-empty"]')).not.toBeNull();
  });

  it('[AC-140-01] backend error renders an inline alert', () => {
    http
      .expectOne((r) => r.url === '/api/business/crm/lists')
      .error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="crm-error"]')).not.toBeNull();
  });
});
