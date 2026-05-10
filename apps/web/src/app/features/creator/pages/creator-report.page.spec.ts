import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CreatorReportPage } from './creator-report.page';

describe('CreatorReportPage', () => {
  let fixture: ComponentFixture<CreatorReportPage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorReportPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorReportPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function buildReport(rows: number) {
    const socialCoverage = Array.from({ length: rows }, (_, i) => ({
      platform: 'INSTAGRAM',
      handle: `@h${i}`,
      followers: 1000 + i,
      engagementRate: 1.5,
      growth: null,
      engagementAverage: 100,
      averageViews: 500,
    }));
    return {
      generatedAt: '2026-05-09T10:00:00Z',
      profile: { id: 'u1', fullName: 'Ali', bio: 'b', category: 'Sport', country: 'MA', gender: 'M' },
      socialCoverage,
      creatorNetwork: [],
      posts: [],
    };
  }

  it('[AC-043-01] renders INFLU logo, generation date, profile and social coverage', () => {
    http.expectOne('/api/creator/me/creator-report').flush(buildReport(2));
    fixture.detectChanges();
    const text = el().textContent ?? '';
    expect(text).toContain('INFLU.ai');
    expect(text).toContain('Generated on 09/05/2026');
    expect(el().querySelector('[data-testid="report-name"]')?.textContent).toContain('Ali');
    expect(el().querySelectorAll('[data-testid="report-social-coverage"] tbody tr').length).toBe(2);
  });

  it('[AC-043-02] paginates social coverage when rows exceed page size', () => {
    http.expectOne('/api/creator/me/creator-report').flush(buildReport(15));
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="report-pagination"]')).not.toBeNull();
    expect(el().querySelectorAll('[data-testid="report-social-coverage"] tbody tr').length).toBe(10);
  });

  it('shows error banner when report API fails', () => {
    http.expectOne('/api/creator/me/creator-report').flush(
      { message: 'boom' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();
    expect(el().querySelector('[data-testid="report-error"]')).not.toBeNull();
  });
});
