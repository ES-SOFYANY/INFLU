import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MagicLinkConsumePage } from './magic-link-consume.page';

describe('MagicLinkConsumePage (US-013)', () => {
  let fixture: ComponentFixture<MagicLinkConsumePage>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MagicLinkConsumePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ token: 'jwt-magic' }) } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MagicLinkConsumePage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function setValue(selector: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      selector,
    )!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(
      new Event('submit'),
    );
  }

  it('renders the "Set your password" heading', () => {
    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain('Set your password');
  });

  it('blocks submission when the password is weak (no API call)', () => {
    setValue('#newPassword', 'short');
    setValue('#confirmPassword', 'short');
    fixture.detectChanges();
    submit();
    fixture.detectChanges();
    http.expectNone('/api/v1/auth/magic-link/consume');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="pwd-error"]'),
    ).not.toBeNull();
  });

  it('shows a mismatch error when both fields differ', () => {
    setValue('#newPassword', 'Sup3rSecret!');
    setValue('#confirmPassword', 'Differ3nt!');
    fixture.detectChanges();
    submit();
    fixture.detectChanges();
    http.expectNone('/api/v1/auth/magic-link/consume');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="match-error"]'),
    ).not.toBeNull();
  });

  it('[AC-013-01] posts and redirects to /auth/register/influencer/social on success', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    setValue('#newPassword', 'Sup3rSecret!');
    setValue('#confirmPassword', 'Sup3rSecret!');
    fixture.detectChanges();
    submit();
    const req = http.expectOne('/api/v1/auth/magic-link/consume');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'jwt-magic', newPassword: 'Sup3rSecret!' });
    req.flush({
      user: { id: 'u1', email: 'jane@example.com', role: 'CREATOR', status: 'ACTIVE' },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
    });
    tick();
    expect(navSpy).toHaveBeenCalledWith('/auth/register/influencer/social');
  }));

  it('[AC-013-02] shows expired-link message on 401', fakeAsync(() => {
    setValue('#newPassword', 'Sup3rSecret!');
    setValue('#confirmPassword', 'Sup3rSecret!');
    fixture.detectChanges();
    submit();
    const req = http.expectOne('/api/v1/auth/magic-link/consume');
    req.flush(
      { code: 'INVALID_MAGIC_LINK', message: 'expired' },
      { status: 401, statusText: 'Unauthorized' },
    );
    tick();
    fixture.detectChanges();
    const banner = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="magic-link-error"]',
    );
    expect(banner?.textContent ?? '').toContain('invalid or has expired');
  }));
});
