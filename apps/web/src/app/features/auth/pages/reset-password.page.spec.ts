import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ResetPasswordPage } from './reset-password.page';

describe('ResetPasswordPage', () => {
  let fixture: ComponentFixture<ResetPasswordPage>;
  let http: HttpTestingController;
  let router: Router;

  function setup(token: string | null): void {
    TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(token ? { token } : {}),
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(ResetPasswordPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  function setValue(selector: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  afterEach(() => http.verify());

  it('renders the form fields', () => {
    setup('valid-token-123');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#pwd')).not.toBeNull();
    expect(el.querySelector('#pwd2')).not.toBeNull();
    expect((el.textContent ?? '').toLowerCase()).toContain('set your password');
  });

  it('flags weak passwords and password mismatch', () => {
    setup('valid-token-123');
    setValue('#pwd', 'weakpass');
    setValue('#pwd2', 'different');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="pwd-error"]')).not.toBeNull();
    http.expectNone('/api/auth/reset-password');
  });

  it('submits a strong matching password and redirects on success', fakeAsync(() => {
    setup('valid-token-123');
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    setValue('#pwd', 'Sup3rSecret');
    setValue('#pwd2', 'Sup3rSecret');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne('/api/auth/reset-password');
    expect(req.request.body).toEqual({ token: 'valid-token-123', newPassword: 'Sup3rSecret' });
    req.flush({
      user: { id: 'u1', email: 'a@b.c', role: 'CREATOR', status: 'ACTIVE' },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
    });
    tick();
    expect(navSpy).toHaveBeenCalledWith('/creator');
  }));

  it('shows an error when the reset token is invalid', fakeAsync(() => {
    setup('bad-token');
    setValue('#pwd', 'Sup3rSecret');
    setValue('#pwd2', 'Sup3rSecret');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne('/api/auth/reset-password');
    req.flush(
      { code: 'INVALID_RESET_TOKEN', message: 'expired' },
      { status: 401, statusText: 'Unauthorized' },
    );
    tick();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="reset-error"]')
        ?.textContent ?? '',
    ).toContain('invalid or has expired');
  }));
});
