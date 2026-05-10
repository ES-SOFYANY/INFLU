import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { BusinessCreatorProfilePage } from './creator-profile.page';

const CREATOR_ID = 'cr-1';

function makeProfile(over: Partial<Record<string, unknown>> = {}): unknown {
  return {
    id: CREATOR_ID,
    name: 'Ali',
    avatarUrl: undefined,
    bio: 'Ali The Moroccan Cyclist: Casablanca Routes & Local Rides',
    longDescription: 'Cyclist passionné basé à Casablanca…',
    country: 'MA',
    gender: 'M',
    mainCategory: 'Motorsports & Biking',
    creatorNetwork: [],
    posts: [],
    socialAccounts: [
      {
        platform: 'INSTAGRAM',
        handle: 'ali.cycling',
        followers: 2400,
        engagementRate: 0,
        growthRate: 0,
        tier: 'NANO',
        linkedAt: new Date().toISOString(),
      },
    ],
    socialCoverage: [
      { platform: 'INSTAGRAM', handle: 'ali.cycling', followers: 2400, engagementRate: null, growth: null, averageViews: 0 },
    ],
    ...over,
  };
}

describe('BusinessCreatorProfilePage', () => {
  let fixture: ComponentFixture<BusinessCreatorProfilePage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessCreatorProfilePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => CREATOR_ID } } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessCreatorProfilePage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flush(over: Partial<Record<string, unknown>> = {}): void {
    http.expectOne(`/api/business/discovery/creators/${CREATOR_ID}`).flush(makeProfile(over) as object);
    fixture.detectChanges();
  }

  it('[AC-132-01] header shows Avatar, Name, Description, Category, Country and Gender', () => {
    flush();
    expect(el().querySelector('[data-testid="profile-avatar"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="profile-name"]')?.textContent).toContain('Ali');
    expect(el().querySelector('[data-testid="profile-bio"]')?.textContent).toContain('Casablanca');
    expect(el().querySelector('[data-testid="badge-category"]')?.textContent).toContain('Motorsports');
    expect(el().querySelector('[data-testid="badge-country"]')?.textContent).toContain('🇲🇦');
    expect(el().querySelector('[data-testid="badge-gender"]')?.textContent).toContain('Male');
  });

  it('[AC-132-02] tabs are Social Coverage / Creator network / Posts / Audience insights (disabled), no "My INFLU"', () => {
    flush();
    const tabs = el().querySelector('[data-testid="profile-tabs"]')!;
    expect(tabs.querySelector('[data-testid="tab-social"]')?.textContent).toContain('Social Coverage');
    expect(tabs.querySelector('[data-testid="tab-network"]')?.textContent).toContain('Creator network');
    expect(tabs.querySelector('[data-testid="tab-posts"]')?.textContent).toContain('Posts');
    const audience = tabs.querySelector<HTMLButtonElement>('[data-testid="tab-audience"]')!;
    expect(audience.textContent).toContain('Audience insights');
    expect(audience.disabled).toBeTrue();
    expect(tabs.textContent).not.toContain('My INFLU');
  });

  it('switches tabs on click', () => {
    flush();
    expect(el().querySelector('[data-testid="social-coverage-table"]')).not.toBeNull();
    el().querySelector<HTMLButtonElement>('[data-testid="tab-network"]')!.click();
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="network-empty"]')).not.toBeNull();
    expect(el().querySelector('[data-testid="social-coverage-table"]')).toBeNull();
  });

  it('shows error banner when profile API fails', () => {
    http
      .expectOne(`/api/business/discovery/creators/${CREATOR_ID}`)
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="profile-error"]')).not.toBeNull();
  });
});

