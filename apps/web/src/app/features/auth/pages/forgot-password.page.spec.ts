import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ForgotPasswordPage } from './forgot-password.page';

describe('ForgotPasswordPage', () => {
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ForgotPasswordPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders the title and email field', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Forgot your password?');
    expect((fixture.nativeElement as HTMLElement).querySelector('#email')).not.toBeNull();
  });

  it('blocks submission on invalid email', () => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#email')!;
    input.value = 'not-an-email';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    http.expectNone('/api/auth/forgot-password');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="email-error"]'),
    ).not.toBeNull();
  });

  it('[AC-012-01,02] submits and shows confirmation', fakeAsync(() => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#email')!;
    input.value = 'jane@example.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne('/api/auth/forgot-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'jane@example.com', locale: 'fr' });
    req.flush({ message: 'ok' });
    tick();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="confirm-title"]')
        ?.textContent ?? '',
    ).toContain('Check your email');
  }));
});
