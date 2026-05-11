import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { BusinessAccountSettingsPage } from './account-settings.page';

const ACCOUNT_INFO = {
  accountType: 'BUSINESS_ACCOUNT',
  email: 'agency@example.com',
  fullName: 'Agency Demo',
  gender: 'M',
  phone: '+212600000000',
  address: 'Casa, MA',
  businessInfo: {
    juridicalForm: 'SARL',
    ice: '000153226000012',
    companyName: 'Agency Demo',
    companyAddress: 'Casablanca, Morocco',
    ifNumber: '1234567',
    rc: '987654',
    tva: '123456',
  },
};

describe('BusinessAccountSettingsPage', () => {
  let fixture: ComponentFixture<BusinessAccountSettingsPage>;
  let http: HttpTestingController;
  const queryParamMap = signalQueryMap('account-management');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessAccountSettingsPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap },
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessAccountSettingsPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushAccount(info: Record<string, unknown> = ACCOUNT_INFO): void {
    http.expectOne('/api/v1/business/me').flush(info);
  }

  function flushBrands(items: unknown[] = []): void {
    http.expectOne('/api/v1/business/brands').flush(items as never);
  }

  function signalQueryMap(value: string) {
    return convertToParamMap({ acc_tab: value });
  }

  it('[AC-170-01] Account Type EXACT "Business Account" and Email is disabled', () => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    const accType = el().querySelector<HTMLInputElement>('[data-testid="account-type"]')!;
    expect(accType.value).toBe('Business Account');
    expect(accType.disabled).toBe(true);
    const email = el().querySelector<HTMLInputElement>('[data-testid="email-readonly"]')!;
    expect(email.disabled).toBe(true);
    expect(email.value).toBe('agency@example.com');
  });

  it('[AC-170-02] Business Information section is read-only and lists all 7 fields', () => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="biz-readonly"]')?.textContent).toContain('Read-only');
    const text = el().querySelector('[data-testid="biz-info"]')?.textContent ?? '';
    ['Juridical Form', 'ICE', 'Company Name', 'Company Address', 'IF', 'RC', 'TVA'].forEach((k) =>
      expect(text).toContain(k),
    );
    ['SARL', '000153226000012', 'Agency Demo', 'Casablanca, Morocco', '1234567', '987654', '123456'].forEach(
      (v) => expect(text).toContain(v),
    );
  });

  it('Update button is disabled until the form is dirty and valid', () => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    const update = el().querySelector<HTMLButtonElement>('[data-testid="update-account"]')!;
    expect(update.disabled).toBe(true);
    const fullName = el().querySelector<HTMLInputElement>('[data-testid="full-name"]')!;
    fullName.value = 'New Name';
    fullName.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(update.disabled).toBe(false);
  });

  it('PATCH /business/me on submit and shows success', fakeAsync(() => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    const fullName = el().querySelector<HTMLInputElement>('[data-testid="full-name"]')!;
    fullName.value = 'Renamed';
    fullName.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="update-account"]')!.click();
    tick();
    const req = http.expectOne((r) => r.url === '/api/v1/business/me' && r.method === 'PATCH');
    req.flush({ ...ACCOUNT_INFO, fullName: 'Renamed' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="account-success"]')?.textContent).toContain(
      'Information updated.',
    );
  }));

  it('Phone field rejects non-9-digit values', () => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    const phone = el().querySelector<HTMLInputElement>('[data-testid="phone"]')!;
    phone.value = '12';
    phone.dispatchEvent(new Event('input'));
    phone.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="phone-error"]')).not.toBeNull();
  });

  it('[AC-174-01] Danger zone shows the EXACT warning text', () => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    const txt = el().querySelector('[data-testid="danger-text"]')?.textContent ?? '';
    expect(txt).toContain(
      'Deleting your account will permanently remove your profile, campaigns, and billing information. This action cannot be undone.',
    );
  });

  it('[AC-174-02] Confirming delete calls DELETE /business/me', fakeAsync(() => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="delete-account-btn"]')!.click();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="delete-confirm"]')!.click();
    tick();
    const req = http.expectOne((r) => r.url === '/api/v1/business/me' && r.method === 'DELETE');
    req.flush({});
  }));

  it('Change password modal validates strong password and confirmation', fakeAsync(() => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="change-password"]')!.click();
    fixture.detectChanges();
    const cur = el().querySelector<HTMLInputElement>('[data-testid="current-pw"]')!;
    const np = el().querySelector<HTMLInputElement>('[data-testid="new-pw"]')!;
    const cp = el().querySelector<HTMLInputElement>('[data-testid="confirm-pw"]')!;
    cur.value = 'Old1234!';
    cur.dispatchEvent(new Event('input'));
    np.value = 'NewStrong1';
    np.dispatchEvent(new Event('input'));
    cp.value = 'NewStrong2';
    cp.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="confirm-pw-error"]')).not.toBeNull();
    cp.value = 'NewStrong1';
    cp.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="pwd-submit"]')!.click();
    tick();
    const req = http.expectOne(
      (r) => r.url === '/api/v1/business/me/password/change' && r.method === 'POST',
    );
    req.flush({});
  }));

  it('[AC-171-01] Brands tab renders the 4 columns and the Link new brand button', fakeAsync(() => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-brands"]')!.click();
    tick();
    fixture.detectChanges();
    const headers = Array.from(el().querySelectorAll('[data-testid="brands-table"] thead th')).map(
      (th) => th.textContent?.trim(),
    );
    expect(headers).toEqual(['Brand', 'Website', 'Country', 'Actions']);
    expect(el().querySelector('[data-testid="link-new-brand"]')?.textContent).toContain(
      'Link new brand',
    );
  }));

  it('[AC-172-02] Reset/Confirm selection are both disabled when nothing is selected', fakeAsync(() => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-brands"]')!.click();
    tick();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="link-new-brand"]')!.click();
    fixture.detectChanges();
    const reset = el().querySelector<HTMLButtonElement>('[data-testid="reset-selection"]')!;
    const confirm = el().querySelector<HTMLButtonElement>('[data-testid="confirm-selection"]')!;
    expect(reset.disabled).toBe(true);
    expect(confirm.disabled).toBe(true);
    expect(el().querySelector('[data-testid="brand-search-hint"]')?.textContent).toContain(
      'Search brand by name or social',
    );
  }));

  it('[AC-172-03] Selecting + confirming a brand POSTs /business/brands/link and refreshes', fakeAsync(() => {
    flushAccount();
    flushBrands();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-brands"]')!.click();
    tick();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="link-new-brand"]')!.click();
    fixture.detectChanges();
    const input = el().querySelector<HTMLInputElement>('[data-testid="brand-search-input"]')!;
    input.value = 'nu';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(250);
    const searchReq = http.expectOne(
      (r) => r.url === '/api/v1/business/brands/search' && r.params.get('q') === 'nu',
    );
    searchReq.flush([
      { id: 'b1', name: 'Nuxe', alreadyLinked: false, country: 'MA' },
      { id: 'b2', name: 'Eucerin', alreadyLinked: false },
    ]);
    fixture.detectChanges();
    const opts = el().querySelectorAll('[data-testid="brand-search-option"]');
    expect(opts.length).toBe(2);
    (opts[0] as HTMLElement).click();
    fixture.detectChanges();
    const confirm = el().querySelector<HTMLButtonElement>('[data-testid="confirm-selection"]')!;
    expect(confirm.disabled).toBe(false);
    confirm.click();
    tick();
    const linkReq = http.expectOne(
      (r) => r.url === '/api/v1/business/brands/link' && r.method === 'POST',
    );
    expect(linkReq.request.body).toEqual({ brandId: 'b1' });
    linkReq.flush({
      id: 'b1',
      name: 'Nuxe',
      country: 'MA',
      accessControl: { members: 1, myRole: 'OWNER' },
    });
    flushBrands([
      { id: 'b1', name: 'Nuxe', country: 'MA', accessControl: { members: 1, myRole: 'OWNER' } },
    ]);
    fixture.detectChanges();
  }));

  it('[AC-173-01] Manage access opens modal with the access list', fakeAsync(() => {
    flushAccount();
    flushBrands([
      {
        id: 'b1',
        name: 'Nuxe',
        country: 'MA',
        website: 'https://nuxe.ma',
        accessControl: { members: 2, myRole: 'OWNER' },
      },
    ]);
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-brands"]')!.click();
    tick();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="manage-access"]')!.click();
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/v1/business/brands/b1/access');
    req.flush([
      {
        userId: 'u1',
        email: 'owner@example.com',
        fullName: 'Owner',
        role: 'OWNER',
        invitedAt: '2026-01-01T00:00:00Z',
      },
    ]);
    fixture.detectChanges();
    const list = el().querySelector('[data-testid="access-list"]')?.textContent ?? '';
    expect(list).toContain('owner@example.com');
    expect(list).toContain('OWNER');
  }));

  it('[AC-173-02] Granting access POSTs to /business/brands/{id}/access', fakeAsync(() => {
    flushAccount();
    flushBrands([
      {
        id: 'b1',
        name: 'Nuxe',
        country: 'MA',
        accessControl: { members: 1, myRole: 'OWNER' },
      },
    ]);
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-brands"]')!.click();
    tick();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="add-access"]')!.click();
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/v1/business/brands/b1/access').flush([]);
    fixture.detectChanges();
    const email = el().querySelector<HTMLInputElement>('[data-testid="invite-email"]')!;
    email.value = 'new@example.com';
    email.dispatchEvent(new Event('input'));
    const role = el().querySelector<HTMLSelectElement>('[data-testid="invite-role"]')!;
    role.value = 'EDITOR';
    role.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="access-invite"]')!.click();
    tick();
    const req = http.expectOne(
      (r) => r.url === '/api/v1/business/brands/b1/access' && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ email: 'new@example.com', role: 'EDITOR' });
    req.flush({
      userId: 'u2',
      email: 'new@example.com',
      role: 'EDITOR',
      invitedAt: '2026-01-01T00:00:00Z',
    });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="access-list"]')?.textContent).toContain(
      'new@example.com',
    );
  }));
});
