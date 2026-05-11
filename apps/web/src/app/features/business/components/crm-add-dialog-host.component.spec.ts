import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CrmAddDialogHostComponent } from './crm-add-dialog-host.component';
import { CrmAddDialogService } from '../data/crm-add-dialog.service';

describe('CrmAddDialogHostComponent (US-142)', () => {
  let fixture: ComponentFixture<CrmAddDialogHostComponent>;
  let http: HttpTestingController;
  let service: CrmAddDialogService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrmAddDialogHostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CrmAddDialogHostComponent);
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CrmAddDialogService);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('[AC-142-01] opening the dialog loads existing CRM lists', () => {
    service.open('cr-42').subscribe();
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/v1/business/crm/lists');
    req.flush({
      items: [{ id: 'l-1', title: 'Beauty MA', description: 'd', creatorsCount: 0, createdAt: '' }],
      page: 1,
      limit: 100,
      total: 1,
    });
    fixture.detectChanges();
    const opts = el().querySelectorAll('[data-testid="crm-add-select"] option');
    expect(opts.length).toBe(2);
    expect(opts[1].textContent).toContain('Beauty MA');
  });

  it('[AC-142-01] picking a list and clicking Confirm POSTs to add the creator', fakeAsync(() => {
    let received: { listId: string; creatorId: string } | null = null;
    service.open('cr-42').subscribe((res) => (received = res));
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/business/crm/lists').flush({
      items: [{ id: 'l-1', title: 'Beauty MA', description: 'd', creatorsCount: 0, createdAt: '' }],
      page: 1,
      limit: 100,
      total: 1,
    });
    fixture.detectChanges();
    const select = el().querySelector<HTMLSelectElement>('[data-testid="crm-add-select"]')!;
    select.value = 'l-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="crm-add-confirm"]')!.click();
    tick();
    http
      .expectOne(
        (r) =>
          r.method === 'POST' && r.url === '/api/v1/business/crm/lists/l-1/creators/cr-42',
      )
      .flush({
        id: 'l-1',
        title: 'Beauty MA',
        description: 'd',
        creatorsCount: 1,
        createdAt: '',
        creators: [],
      });
    tick();
    expect(received as { listId: string; creatorId: string } | null).toEqual({
      listId: 'l-1',
      creatorId: 'cr-42',
    });
  }));

  it('[AC-142-01] handles 409 ALREADY_IN_LIST as inline error', fakeAsync(() => {
    service.open('cr-42').subscribe();
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/business/crm/lists').flush({
      items: [{ id: 'l-1', title: 'Beauty MA', description: 'd', creatorsCount: 0, createdAt: '' }],
      page: 1,
      limit: 100,
      total: 1,
    });
    fixture.detectChanges();
    const select = el().querySelector<HTMLSelectElement>('[data-testid="crm-add-select"]')!;
    select.value = 'l-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="crm-add-confirm"]')!.click();
    tick();
    http
      .expectOne(
        (r) =>
          r.method === 'POST' && r.url === '/api/v1/business/crm/lists/l-1/creators/cr-42',
      )
      .error(new ProgressEvent('error'), { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="crm-add-error"]')?.textContent).toContain(
      'already in the selected list',
    );
  }));

  it('[AC-142-02] confirm result is forwarded to the caller (acts as confirmation signal)', fakeAsync(() => {
    let received: { listId: string; creatorId: string } | null = null;
    service.open('cr-42').subscribe((res) => (received = res));
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/business/crm/lists').flush({
      items: [{ id: 'l-2', title: 'Tech', description: 'd', creatorsCount: 0, createdAt: '' }],
      page: 1,
      limit: 100,
      total: 1,
    });
    fixture.detectChanges();
    const select = el().querySelector<HTMLSelectElement>('[data-testid="crm-add-select"]')!;
    select.value = 'l-2';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="crm-add-confirm"]')!.click();
    tick();
    http
      .expectOne(
        (r) => r.method === 'POST' && r.url === '/api/v1/business/crm/lists/l-2/creators/cr-42',
      )
      .flush({
        id: 'l-2',
        title: 'Tech',
        description: 'd',
        creatorsCount: 1,
        createdAt: '',
        creators: [],
      });
    tick();
    expect(received as { listId: string; creatorId: string } | null).not.toBeNull();
  }));
});
