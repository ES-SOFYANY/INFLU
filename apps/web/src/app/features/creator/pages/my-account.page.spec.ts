import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { CreatorMyAccountPage } from './my-account.page';

describe('CreatorMyAccountPage', () => {
  let fixture: ComponentFixture<CreatorMyAccountPage>;
  let http: HttpTestingController;
  let router: Router;

  const profile = {
    id: 'u1',
    fullName: 'Ali',
    bio: 'The Moroccan Cyclist',
    category: 'Motorsports & Biking',
    country: 'Morocco',
    gender: 'M',
    description: 'Long description.',
  };

  const social = [
    {
      platform: 'YOUTUBE',
      handle: '@cyclingforlife',
      followers: 1070,
      engagementRate: 0.91,
      growth: null,
      engagementAverage: 19000,
      averageViews: 766500,
    },
    {
      platform: 'INSTAGRAM',
      handle: '@ali.cycling',
      followers: 2400,
      engagementRate: null,
      growth: null,
      engagementAverage: 0,
      averageViews: 0,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorMyAccountPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorMyAccountPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
    http.expectOne('/api/v1/creator/me/profile-overview').flush(profile);
    http.expectOne('/api/v1/creator/me/social-coverage').flush(social);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('[AC-041-01] renders header avatar, name, bio, category, country, gender', () => {
    expect(el().querySelector('[data-testid="profile-name"]')?.textContent).toContain('Ali');
    expect(el().querySelector('[data-testid="profile-bio"]')?.textContent).toContain('Moroccan Cyclist');
    expect(el().querySelector('[data-testid="profile-category"]')?.textContent).toContain('Motorsports');
    expect(el().querySelector('[data-testid="profile-country"]')?.textContent).toContain('Morocco');
    expect(el().querySelector('[data-testid="profile-gender"]')?.textContent).toContain('Male');
  });

  it('[AC-041-02] Profile overview kebab opens action menu', () => {
    expect(el().querySelector('[data-testid="overview-menu"]')).toBeNull();
    el().querySelector<HTMLButtonElement>('[data-testid="overview-kebab"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="overview-menu"]')).not.toBeNull();
  });

  it('[AC-042-01] Social Coverage tab is selected by default with 7 columns', () => {
    const tab = el().querySelector('[data-testid="tab-social-coverage"]')!;
    expect(tab.getAttribute('aria-selected')).toBe('true');
    const headers = Array.from(el().querySelectorAll('[data-testid="social-coverage-table"] thead th')).map(
      (th) => th.textContent?.trim(),
    );
    expect(headers).toEqual([
      'Platform',
      'Social media',
      'Followers',
      'Engagement rate',
      'Growth',
      'Engagement avg.',
      'Average views',
    ]);
  });

  it('[AC-022-02] engagement shows "--" and growth shows "N/A" when null', () => {
    const rows = el().querySelectorAll('[data-testid="social-coverage-table"] tbody tr');
    expect(rows.length).toBe(2);
    const ig = rows[1].textContent ?? '';
    expect(ig).toContain('--'); // engagement rate fallback
    expect(ig).toContain('N/A'); // growth fallback
  });

  it('[AC-042-02] Audience insights tab is disabled', () => {
    const audTab = el().querySelector<HTMLButtonElement>('[data-testid="tab-audience"]')!;
    expect(audTab.disabled).toBe(true);
    expect(audTab.getAttribute('aria-disabled')).toBe('true');
  });

  it('[AC-043-01] "Generate creator report" navigates to /creator/creator-report', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    el().querySelector<HTMLButtonElement>('[data-testid="overview-kebab"]')!.click();
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="generate-report"]')!.click();
    tick();
    expect(navSpy).toHaveBeenCalledWith('/creator/creator-report');
  }));
});
