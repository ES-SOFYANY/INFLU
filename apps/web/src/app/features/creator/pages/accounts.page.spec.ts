import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { CreatorAccountsPage } from './accounts.page';

describe('CreatorAccountsPage', () => {
  let fixture: ComponentFixture<CreatorAccountsPage>;
  let http: HttpTestingController;
  let router: Router;

  function setup(): void {
    fixture = TestBed.createComponent(CreatorAccountsPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
    // 4 GETs on init: account info, billing, pricing, cin
    http.expectOne('/api/v1/creator/me').flush({
      accountType: 'CONTENT_CREATOR',
      email: 'ali@example.com',
      fullName: 'Ali',
      gender: 'M',
      phone: '+212600000000',
      address: 'Casablanca',
    });
    http.expectOne('/api/v1/creator/me/billing').flush({ ice: null, billingProfile: null });
    http.expectOne('/api/v1/creator/me/pricing').flush({
      lines: [
        {
          accountHandle: '@ali.cycling',
          platform: 'INSTAGRAM',
          contentFormat: 'REEL',
          rateMin: 100,
          rateMax: 300,
          currency: 'MAD',
        },
      ],
      suggestedRange: { currency: 'MAD', min: 50, max: 500 },
    });
    http.expectOne('/api/v1/creator/me/documents/cin').flush({ status: 'PENDING_VALIDATION', cinNumber: 'AB123456', dateOfExpiry: '2030-01-15' });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorAccountsPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    setup();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  // --- US-070 ---

  it('[AC-070-01] Account Type is "Content Creator" and Email is disabled', () => {
    const type = el().querySelector<HTMLInputElement>('[data-testid="account-type"]')!;
    expect(type.value).toBe('Content Creator');
    expect(type.disabled).toBe(true);
    const email = el().querySelector<HTMLInputElement>('[data-testid="email-readonly"]')!;
    expect(email.disabled).toBe(true);
    expect(email.value).toBe('ali@example.com');
  });

  it('[AC-070-02] Update Information and Reset are disabled when no field is changed', () => {
    const reset = el().querySelector<HTMLButtonElement>('[data-testid="reset-account"]')!;
    const update = el().querySelector<HTMLButtonElement>('[data-testid="update-account"]')!;
    expect(reset.disabled).toBe(true);
    expect(update.disabled).toBe(true);
  });

  it('[AC-070-03] Update Information becomes enabled after modifying Address', () => {
    const addr = el().querySelector<HTMLInputElement>('[data-testid="address"]')!;
    addr.value = 'Rabat';
    addr.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el().querySelector<HTMLButtonElement>('[data-testid="update-account"]')!.disabled).toBe(false);
    expect(el().querySelector<HTMLButtonElement>('[data-testid="reset-account"]')!.disabled).toBe(false);
  });

  it('PATCH /creator/me submits +212-prefixed phone', fakeAsync(() => {
    const phone = el().querySelector<HTMLInputElement>('[data-testid="phone"]')!;
    phone.value = '612345678';
    phone.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne((r) => r.method === 'PATCH' && r.url === '/api/v1/creator/me');
    expect(req.request.body.phone).toBe('+212612345678');
    req.flush({
      accountType: 'CONTENT_CREATOR',
      email: 'ali@example.com',
      fullName: 'Ali',
      phone: '+212612345678',
    });
    tick();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="account-success"]')).not.toBeNull();
  }));

  // --- US-071 ---

  it('[AC-071-01] Change password button opens the modal', () => {
    expect(el().querySelector('[data-testid="password-modal"]')).toBeNull();
    el().querySelector<HTMLButtonElement>('[data-testid="change-password"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="password-modal"]')).not.toBeNull();
  });

  it('[AC-071-02] weak password shows complexity error', () => {
    el().querySelector<HTMLButtonElement>('[data-testid="change-password"]')!.click();
    fixture.detectChanges();
    const newPw = el().querySelector<HTMLInputElement>('[data-testid="new-pw"]')!;
    newPw.value = 'abc';
    newPw.dispatchEvent(new Event('input'));
    newPw.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="new-pw-error"]')).not.toBeNull();
  });

  it('successful password change closes the modal', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="change-password"]')!.click();
    fixture.detectChanges();
    const set = (sel: string, v: string) => {
      const i = el().querySelector<HTMLInputElement>(sel)!;
      i.value = v;
      i.dispatchEvent(new Event('input'));
    };
    set('[data-testid="current-pw"]', 'OldPass1!');
    set('[data-testid="new-pw"]', 'NewPass123');
    set('[data-testid="confirm-pw"]', 'NewPass123');
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="pwd-submit"]')!.click();
    const req = http.expectOne('/api/v1/creator/me/password/change');
    expect(req.request.body).toEqual({ currentPassword: 'OldPass1!', newPassword: 'NewPass123' });
    req.flush(null);
    tick();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="password-modal"]')).toBeNull();
  }));

  // --- US-072 ---

  it('[AC-072-01] Business is the default radio', () => {
    const business = el().querySelector<HTMLInputElement>('[data-testid="bil-business"]')!;
    expect(business.checked).toBe(true);
  });

  it('[AC-072-02] Search and Approve are disabled when ICE is empty', () => {
    expect(el().querySelector<HTMLButtonElement>('[data-testid="ice-search"]')!.disabled).toBe(true);
    expect(el().querySelector<HTMLButtonElement>('[data-testid="ice-approve"]')!.disabled).toBe(true);
  });

  it('[AC-072-02] Approve becomes enabled after a successful ICE search', fakeAsync(() => {
    const ice = el().querySelector<HTMLInputElement>('[data-testid="ice-input"]')!;
    ice.value = '000000000000001';
    ice.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el().querySelector<HTMLButtonElement>('[data-testid="ice-search"]')!.disabled).toBe(false);
    el().querySelector<HTMLButtonElement>('[data-testid="ice-search"]')!.click();
    const req = http.expectOne('/api/v1/creator/me/billing/ice/search');
    req.flush({ ice: '000000000000001', companyName: 'Acme', juridicalForm: 'SARL' });
    tick();
    fixture.detectChanges();
    expect(el().querySelector<HTMLButtonElement>('[data-testid="ice-approve"]')!.disabled).toBe(false);
    expect(el().querySelector('[data-testid="ice-found"]')?.textContent).toContain('Acme');
  }));

  // --- US-073 ---

  it('[AC-073-01] Pricing tab shows the table when acc_tab=billing', () => {
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-pricing"]')!.click();
    fixture.detectChanges();
    const headers = Array.from(el().querySelectorAll('[data-testid="pricing-table"] thead th')).map(
      (th) => th.textContent?.trim(),
    );
    expect(headers).toEqual(['Account', 'Platform', 'Content format', 'Rate (Dhs)', 'Estimated price', '']);
  });

  it('[AC-073-02] Save account pricing PUTs the lines', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-pricing"]')!.click();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="save-pricing-0"]')!.click();
    const req = http.expectOne('/api/v1/creator/me/pricing');
    expect(req.request.method).toBe('PUT');
    req.flush({
      lines: [
        {
          accountHandle: '@ali.cycling',
          platform: 'INSTAGRAM',
          contentFormat: 'REEL',
          rateMin: 100,
          rateMax: 300,
          currency: 'MAD',
        },
      ],
      suggestedRange: { currency: 'MAD', min: 50, max: 500 },
    });
    tick();
    fixture.detectChanges();
  }));

  it('[AC-073-03] footer shows the suggested market range hint', () => {
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-pricing"]')!.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('Suggested market range based on your profile and past deals.');
  });

  // --- US-074 / US-075 ---

  it('[AC-074-01] CIN status badge shows "Pending Validation" after submit', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-documents"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="cin-status-badge"]')?.textContent).toContain('Pending Validation');
    el().querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne('/api/v1/creator/me/documents/cin');
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'PENDING_VALIDATION', cinNumber: 'AB123456', dateOfExpiry: '2030-01-15' });
    tick();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="cin-status-badge"]')?.textContent).toContain('Pending Validation');
  }));

  it('[AC-074-03] Attestation block contains the optional-document message', () => {
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-documents"]')!.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('You do not need to provide this document if you are not a company.');
  });

  it('[AC-075-01] Cancel Validation is enabled when CIN status is PENDING_VALIDATION', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-documents"]')!.click();
    fixture.detectChanges();
    const btn = el().querySelector<HTMLButtonElement>('[data-testid="cin-cancel"]')!;
    expect(btn.disabled).toBe(false);
    btn.click();
    const req = http.expectOne('/api/v1/creator/me/documents/cin/cancel');
    req.flush({ status: 'CANCELLED' });
    tick();
    fixture.detectChanges();
    // [AC-075-02] After cancel, no Pending Validation badge
    expect(el().querySelector('[data-testid="cin-status-badge"]')).toBeNull();
  }));

  // --- US-076 ---

  it('[AC-076-01] Danger zone shows the EXACT warning text', () => {
    expect(el().querySelector('[data-testid="danger-text"]')?.textContent?.trim()).toBe(
      'Deleting your account will permanently remove your profile, campaigns, and billing information. This action cannot be undone.',
    );
  });

  it('[AC-076-02] Delete confirmation calls DELETE and redirects to /', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    el().querySelector<HTMLButtonElement>('[data-testid="delete-account-btn"]')!.click();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="delete-confirm"]')!.click();
    const req = http.expectOne('/api/v1/creator/me');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    tick();
    expect(navSpy).toHaveBeenCalledWith('/');
  }));

  it('Reset reverts the form to the loaded values', () => {
    const addr = el().querySelector<HTMLInputElement>('[data-testid="address"]')!;
    addr.value = 'Rabat';
    addr.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="reset-account"]')!.click();
    fixture.detectChanges();
    expect(addr.value).toBe('Casablanca');
  });

  it('phone validator rejects non-9-digit input', () => {
    const phone = el().querySelector<HTMLInputElement>('[data-testid="phone"]')!;
    phone.value = '123';
    phone.dispatchEvent(new Event('input'));
    phone.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="phone-error"]')).not.toBeNull();
  });

  it('ICE search 404 shows "ICE not found." error', fakeAsync(() => {
    const ice = el().querySelector<HTMLInputElement>('[data-testid="ice-input"]')!;
    ice.value = '111111111111111';
    ice.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="ice-search"]')!.click();
    const req = http.expectOne('/api/v1/creator/me/billing/ice/search');
    req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });
    tick();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="ice-search-error"]')?.textContent).toContain(
      'ICE not found.',
    );
  }));

  it('switching to Auto-entrepreneur radio updates the billing profile', () => {
    const auto = el().querySelector<HTMLInputElement>('[data-testid="bil-auto"]')!;
    auto.click();
    fixture.detectChanges();
    expect(auto.checked).toBe(true);
  });

  it('uploads RIB file via pre-signed URL', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-documents"]')!.click();
    fixture.detectChanges();
    const input = el().querySelector<HTMLInputElement>('[data-testid="rib-file"]')!;
    const file = new File(['rib'], 'rib.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="rib-upload"]')!.click();
    const req = http.expectOne('/api/v1/creator/me/documents/rib/upload-url');
    expect(req.request.method).toBe('POST');
    req.flush({ uploadUrl: 'https://x', objectKey: 'k', expiresIn: 900 });
    tick();
    fixture.detectChanges();
  }));

  it('PUT pricing updates rateMin/rateMax from input changes', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="acc-tab-pricing"]')!.click();
    fixture.detectChanges();
    const min = el().querySelector<HTMLInputElement>('[data-testid="rate-min-0"]')!;
    min.value = '200';
    min.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="save-pricing-0"]')!.click();
    const req = http.expectOne('/api/v1/creator/me/pricing');
    expect(req.request.body.lines[0].rateMin).toBe(200);
    req.flush({
      lines: [
        {
          accountHandle: '@ali.cycling',
          platform: 'INSTAGRAM',
          contentFormat: 'REEL',
          rateMin: 200,
          rateMax: 300,
          currency: 'MAD',
        },
      ],
      suggestedRange: { currency: 'MAD', min: 50, max: 500 },
    });
    tick();
  }));
});
