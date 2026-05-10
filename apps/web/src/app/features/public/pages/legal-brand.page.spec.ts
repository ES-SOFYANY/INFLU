import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LegalBrandPage } from './legal-brand.page';

describe('LegalBrandPage', () => {
  it('[AC-004-01] renders the brand legal mentions sections', async () => {
    await TestBed.configureTestingModule({
      imports: [LegalBrandPage],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(LegalBrandPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Brand legal mentions');
    expect(text).toContain('1. Operator');
    expect(text).toContain('4. Payment terms');
    expect(text).toContain('6. Termination');
  });
});
