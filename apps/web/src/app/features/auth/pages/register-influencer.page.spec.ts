import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { RegisterInfluencerPage } from './register-influencer.page';

describe('RegisterInfluencerPage', () => {
  let fixture: ComponentFixture<RegisterInfluencerPage>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterInfluencerPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterInfluencerPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function setValue(selector: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
  function setSelect(selector: string, value: string): void {
    const sel = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(selector)!;
    sel.value = value;
    sel.dispatchEvent(new Event('change'));
  }
  function check(selector: string, value: boolean): void {
    const cb = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector)!;
    cb.checked = value;
    cb.dispatchEvent(new Event('change'));
  }

  function fillValid(): void {
    setValue('#email', 'jane@example.com');
    setSelect('#gender', 'M');
    setValue('#fullName', 'Jane Doe');
    setValue('#country', 'MA');
    setValue('#phone', '600000000');
    setValue('#city', 'Casablanca');
    check('[data-testid="accept-legal"]', true);
    check('[data-testid="age-over-18"]', true);
    fixture.detectChanges();
  }

  it('[AC-016-03] renders a fixed +212 phone prefix', () => {
    const prefix = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="phone-prefix"]',
    );
    expect(prefix?.textContent?.trim()).toBe('+212');
  });

  it('[AC-016-01] does not render any password field', () => {
    const passwordInputs = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'input[type="password"]',
    );
    expect(passwordInputs.length).toBe(0);
  });

  it('[AC-016-02] blocks submission when checkboxes are not ticked', () => {
    setValue('#email', 'jane@example.com');
    setSelect('#gender', 'M');
    setValue('#fullName', 'Jane Doe');
    setValue('#country', 'MA');
    setValue('#phone', '600000000');
    setValue('#city', 'Casablanca');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    http.expectNone('/api/auth/register/CREATOR');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="checkbox-error"]'),
    ).not.toBeNull();
  });

  it('flags an invalid Moroccan phone number', () => {
    fillValid();
    setValue('#phone', '12345');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    http.expectNone('/api/auth/register/CREATOR');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="phone-error"]'),
    ).not.toBeNull();
  });

  it('[AC-016-04] posts to /auth/register/CREATOR and redirects to magic-link-sent', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);
    fillValid();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne('/api/auth/register/CREATOR');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.phone).toBe('+212600000000');
    expect(req.request.body.acceptLegal).toBe(true);
    expect(req.request.body.ageOver18).toBe(true);
    req.flush({ id: 'u1', email: 'jane@example.com', role: 'CREATOR', status: 'PENDING_PASSWORD' });
    tick();
    expect(navSpy).toHaveBeenCalledWith(['/auth/magic-link-sent'], {
      queryParams: { email: 'jane@example.com' },
    });
  }));

  it('shows API error message on 4xx', fakeAsync(() => {
    fillValid();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne('/api/auth/register/CREATOR');
    req.flush(
      { code: 'EMAIL_ALREADY_USED', message: 'Email is already registered' },
      { status: 409, statusText: 'Conflict' },
    );
    tick();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="register-error"]')
        ?.textContent ?? '',
    ).toContain('Email is already registered');
  }));
});
