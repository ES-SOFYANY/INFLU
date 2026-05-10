import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { OnboardPage } from './onboard.page';

describe('OnboardPage (US-018)', () => {
  let fixture: ComponentFixture<OnboardPage>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ type: 'brand' }) } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OnboardPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function setValue(selector: string, value: string): void {
    const input = el().querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input'));
  }

  function check(selector: string, value: boolean): void {
    const cb = el().querySelector<HTMLInputElement>(selector)!;
    cb.checked = value;
    cb.dispatchEvent(new Event('change'));
  }

  function submit(): void {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  function fillValid(): void {
    setValue('#email', 'biz@example.com');
    setValue('#gender', 'M');
    setValue('#fullName', 'Jane Boss');
    setValue('#phone', '600000000');
    setValue('#address', '12 Bd Zerktouni, Casablanca');
    setValue('#password', 'Sup3rSecret!');
    setValue('#juridicalForm', 'SARL');
    setValue('#companyName', 'INFLU SARL');
    setValue('#companyAddress', '12 Bd Zerktouni');
    setValue('#ice', '000153226000012');
    setValue('#if', '1234567');
    setValue('#rc', '12345');
    setValue('#tva', '999');
    check('[data-testid="accept-legal"]', true);
    fixture.detectChanges();
  }

  it('renders the "Join INFLU as a Business" headline + Account Type select', () => {
    expect(el().textContent ?? '').toContain('Join INFLU as a Business');
    expect(el().querySelector<HTMLSelectElement>('#accountType')?.value).toBe('brand');
  });

  it('[AC-018-01] renders the Account Information fields (email, gender, fullName, phone +212, address, password)', () => {
    expect(el().querySelector('#email')).not.toBeNull();
    expect(el().querySelector('#gender')).not.toBeNull();
    expect(el().querySelector('#fullName')).not.toBeNull();
    expect(el().querySelector('#address')).not.toBeNull();
    expect(el().querySelector('#password')).not.toBeNull();
    expect(el().querySelector('[data-testid="phone-prefix"]')?.textContent?.trim()).toBe('+212');
  });

  it('[AC-018-02] renders the Business Information fields (juridicalForm, ICE, companyName, companyAddress, IF, RC, TVA)', () => {
    for (const id of [
      '#juridicalForm',
      '#ice',
      '#companyName',
      '#companyAddress',
      '#if',
      '#rc',
      '#tva',
    ]) {
      expect(el().querySelector(id)).not.toBeNull();
    }
  });

  it('flags an ICE that is not 15 digits', () => {
    fillValid();
    setValue('#ice', '12345');
    fixture.detectChanges();
    submit();
    fixture.detectChanges();
    http.expectNone('/api/auth/onboard/business');
    expect(el().querySelector('[data-testid="ice-error"]')).not.toBeNull();
  });

  it('flags a weak password', () => {
    fillValid();
    setValue('#password', 'weak');
    fixture.detectChanges();
    submit();
    fixture.detectChanges();
    http.expectNone('/api/auth/onboard/business');
    expect(el().querySelector('[data-testid="password-error"]')).not.toBeNull();
  });

  it('flags an invalid Moroccan phone', () => {
    fillValid();
    setValue('#phone', '12');
    fixture.detectChanges();
    submit();
    fixture.detectChanges();
    http.expectNone('/api/auth/onboard/business');
    expect(el().querySelector('[data-testid="phone-error"]')).not.toBeNull();
  });

  it('[AC-018-02] posts to /auth/onboard/business and redirects to /business on success', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fillValid();
    submit();
    const req = http.expectOne('/api/auth/onboard/business');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.accountType).toBe('brand');
    expect(req.request.body.phone).toBe('+212600000000');
    expect(req.request.body.ice).toBe('000153226000012');
    expect(req.request.body.acceptLegal).toBe(true);
    req.flush({
      user: { id: 'u1', email: 'biz@example.com', role: 'BUSINESS', status: 'ACTIVE' },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
    });
    tick();
    expect(navSpy).toHaveBeenCalledWith('/business');
  }));

  it('shows an error when the email is already used (409 EMAIL_ALREADY_USED)', fakeAsync(() => {
    fillValid();
    submit();
    const req = http.expectOne('/api/auth/onboard/business');
    req.flush(
      { code: 'EMAIL_ALREADY_USED', message: 'duplicate' },
      { status: 409, statusText: 'Conflict' },
    );
    tick();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="onboard-error"]')?.textContent ?? '').toContain(
      'already registered',
    );
  }));

  it('shows an error when ICE is already used (409 ICE_ALREADY_USED)', fakeAsync(() => {
    fillValid();
    submit();
    const req = http.expectOne('/api/auth/onboard/business');
    req.flush(
      { code: 'ICE_ALREADY_USED', message: 'duplicate' },
      { status: 409, statusText: 'Conflict' },
    );
    tick();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="onboard-error"]')?.textContent ?? '').toContain(
      'ICE',
    );
  }));
});
