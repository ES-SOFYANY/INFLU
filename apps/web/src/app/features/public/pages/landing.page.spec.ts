import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LandingPage } from './landing.page';

describe('LandingPage', () => {
  let fixture: ComponentFixture<LandingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
  });

  it('[AC-001-01] renders the landing hero in French', () => {
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain("L'influencer marketing");
    expect(html).toContain('réinventé par l');
    expect(html).toContain('Inscrivez-vous gratuitement');
    expect(html).toContain('Réserver une démo');
  });

  it('[AC-001-02] links to thematic pages and legal in the footer', () => {
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a[href]'),
    ).map((a) => a.getAttribute('href'));
    expect(links).toContain('/for-influencers');
    expect(links).toContain('/for-brands');
    expect(links).toContain('/legal/brand');
    expect(links).toContain('/legal/creator');
    expect(links).toContain('/legal/privacy');
    expect(links).toContain('/auth/register');
  });
});
