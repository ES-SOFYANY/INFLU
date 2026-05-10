import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { RegisterInfluencerSocialPage } from './register-influencer-social.page';

describe('RegisterInfluencerSocialPage (US-017)', () => {
  let fixture: ComponentFixture<RegisterInfluencerSocialPage>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterInfluencerSocialPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterInfluencerSocialPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the 4 platform CTAs (Instagram / YouTube / TikTok / Twitter)', () => {
    expect(el().querySelector('[data-testid="link-instagram"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="link-youtube"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="link-tiktok"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="link-twitter"]')).not.toBeNull();
  });

  it('[AC-017-01] disables "Finish registration" until at least one account is linked', () => {
    const finish = el().querySelector<HTMLButtonElement>('[data-testid="finish-button"]')!;
    expect(finish.disabled).toBeTrue();
    expect(el().querySelector('[data-testid="next-disabled-reason"]')).not.toBeNull();
  });

  it('[AC-017-02] links Instagram and shows handle + followers + tier', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="link-instagram"]')!.click();
    const req = http.expectOne('/api/creator/me/social-accounts/instagram/link');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ oauthCode: 'mock-success-janedoe' });
    req.flush({
      platform: 'INSTAGRAM',
      handle: 'janedoe',
      followers: 12300,
      engagementRate: 4.2,
      growthRate: 1.8,
      tier: 'MICRO',
      linkedAt: '2026-05-10T10:00:00Z',
    });
    tick();
    fixture.detectChanges();
    const linked = el().querySelector('[data-testid="linked-instagram"]');
    expect(linked?.textContent ?? '').toContain('janedoe');
    expect(linked?.textContent ?? '').toContain('12300');
    expect(linked?.textContent ?? '').toContain('MICRO');
    // Now the finish button is enabled
    const finish = el().querySelector<HTMLButtonElement>('[data-testid="finish-button"]')!;
    expect(finish.disabled).toBeFalse();
  }));

  it('shows an error on 409 SOCIAL_ALREADY_LINKED', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="link-instagram"]')!.click();
    const req = http.expectOne('/api/creator/me/social-accounts/instagram/link');
    req.flush(
      { code: 'SOCIAL_ALREADY_LINKED', message: 'duplicate' },
      { status: 409, statusText: 'Conflict' },
    );
    tick();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="social-error"]')?.textContent ?? '').toContain(
      'already linked',
    );
  }));

  it('shows OAuth-failed message on 401', fakeAsync(() => {
    el().querySelector<HTMLButtonElement>('[data-testid="link-instagram"]')!.click();
    const req = http.expectOne('/api/creator/me/social-accounts/instagram/link');
    req.flush({ code: 'OAUTH_FAILED' }, { status: 401, statusText: 'Unauthorized' });
    tick();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="social-error"]')?.textContent ?? '').toContain(
      'OAuth',
    );
  }));

  it('navigates to /creator once at least one account is linked and Finish is clicked', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    el().querySelector<HTMLButtonElement>('[data-testid="link-instagram"]')!.click();
    const req = http.expectOne('/api/creator/me/social-accounts/instagram/link');
    req.flush({
      platform: 'INSTAGRAM',
      handle: 'janedoe',
      followers: 12300,
      engagementRate: 4.2,
      growthRate: 1.8,
      tier: 'MICRO',
      linkedAt: '2026-05-10T10:00:00Z',
    });
    tick();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="finish-button"]')!.click();
    expect(navSpy).toHaveBeenCalledWith('/creator');
  }));
});
