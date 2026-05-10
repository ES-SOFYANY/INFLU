import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ForBrandsPage } from './for-brands.page';

describe('ForBrandsPage', () => {
  let fixture: ComponentFixture<ForBrandsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForBrandsPage],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ForBrandsPage);
    fixture.detectChanges();
  });

  it('[AC-003-01] displays the 9-step AI brand journey', () => {
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'section .glass-card',
    );
    expect(cards.length).toBeGreaterThanOrEqual(9);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain("9 étapes guidées par l'IA");
    expect(text).toContain('Brief IA généré');
    expect(text).toContain('Suivi performance temps réel');
  });

  it('[AC-003-02] exposes "Réserver une démo" CTAs', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Réserver une démo');
  });
});
