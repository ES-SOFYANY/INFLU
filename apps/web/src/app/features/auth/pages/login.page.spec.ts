import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function setEmail(value: string): void {
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#email')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
  function setPassword(value: string): void {
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#password')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('renders the welcome heading + Google CTA', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Welcome back to INFLU!');
    expect(text).toContain('Sign In');
    expect(text).toContain('Continue with Google');
  });

  it('[AC-010-04] toggles password visibility', () => {
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#password')!;
    expect(input.type).toBe('password');
    el.querySelector<HTMLButtonElement>('[data-testid="toggle-password"]')!.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });

  it('blocks submission when the form is invalid (validation messages)', () => {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="email-error"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="password-error"]')).not.toBeNull();
    http.expectNone('/api/v1/auth/login');
  });

  it('[AC-010-01] navigates to /creator after successful CREATOR login', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    setEmail('jane@example.com');
    setPassword('Sup3rSecret!');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'jane@example.com', password: 'Sup3rSecret!' });
    req.flush({
      user: { id: 'u1', email: 'jane@example.com', role: 'CREATOR', status: 'ACTIVE' },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
    });
    tick();
    expect(navSpy).toHaveBeenCalledWith('/creator');
  }));

  it('[AC-010-02] navigates to /business after successful BUSINESS login', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    setEmail('biz@example.com');
    setPassword('Sup3rSecret!');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne('/api/v1/auth/login');
    req.flush({
      user: { id: 'u2', email: 'biz@example.com', role: 'BUSINESS', status: 'ACTIVE' },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
    });
    tick();
    expect(navSpy).toHaveBeenCalledWith('/business');
  }));

  it('[AC-010-03] shows an error message on 401', fakeAsync(() => {
    setEmail('jane@example.com');
    setPassword('badpassword');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne('/api/v1/auth/login');
    req.flush(
      { code: 'INVALID_CREDENTIALS', message: 'bad' },
      { status: 401, statusText: 'Unauthorized' },
    );
    tick();
    fixture.detectChanges();
    const banner = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="login-error"]');
    expect(banner?.textContent ?? '').toContain('Invalid email or password');
  }));

  it('[AC-011-01] Continue with Google posts the dev mock token', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    setEmail('jane@example.com');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="google-button"]')!
      .click();
    const req = http.expectOne('/api/v1/auth/google/callback');
    expect(req.request.body).toEqual({ idToken: 'mock-google-success-jane@example.com' });
    req.flush({
      user: { id: 'u3', email: 'jane@example.com', role: 'CREATOR', status: 'ACTIVE' },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
    });
    tick();
    expect(navSpy).toHaveBeenCalledWith('/creator');
  }));
});
