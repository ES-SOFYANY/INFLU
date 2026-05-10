import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MagicLinkSentPage } from './magic-link-sent.page';

function withQueryParams(params: Record<string, string>): { provide: typeof ActivatedRoute; useValue: unknown } {
  const map = convertToParamMap(params);
  return {
    provide: ActivatedRoute,
    useValue: { queryParamMap: of(map), snapshot: { queryParamMap: map } },
  };
}

describe('MagicLinkSentPage (US-013)', () => {
  it('[AC-013-01] renders headline + back-to-sign-in CTA', async () => {
    await TestBed.configureTestingModule({
      imports: [MagicLinkSentPage],
      providers: [provideRouter([]), withQueryParams({})],
    }).compileComponents();
    const fixture = TestBed.createComponent(MagicLinkSentPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Check your inbox');
    expect(text).toContain('Back to sign in');
  });

  it('[AC-013-01] personalizes the message with the ?email query param', async () => {
    await TestBed.configureTestingModule({
      imports: [MagicLinkSentPage],
      providers: [provideRouter([]), withQueryParams({ email: 'jane@example.com' })],
    }).compileComponents();
    const fixture = TestBed.createComponent(MagicLinkSentPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="magic-link-email"]')?.textContent).toBe(
      'jane@example.com',
    );
  });
});
