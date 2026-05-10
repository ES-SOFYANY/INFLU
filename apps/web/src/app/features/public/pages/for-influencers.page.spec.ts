import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ForInfluencersPage } from './for-influencers.page';

describe('ForInfluencersPage', () => {
  let fixture: ComponentFixture<ForInfluencersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForInfluencersPage],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ForInfluencersPage);
    fixture.detectChanges();
  });

  it('[AC-002-01] displays the 6-step creator journey', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Le parcours en 6 étapes');
    expect(text).toContain('Inscription en quelques secondes');
    expect(text).toContain('Soyez récompensé');
    const steps = (fixture.nativeElement as HTMLElement).querySelectorAll('ol > li.glass-card');
    expect(steps.length).toBe(6);
  });

  it('[AC-002-02] exposes a creator-registration CTA', () => {
    const ctas = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a[href="/auth/register"]'),
    );
    expect(ctas.length).toBeGreaterThan(0);
  });
});
