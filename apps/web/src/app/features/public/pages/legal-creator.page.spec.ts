import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LegalCreatorPage } from './legal-creator.page';

describe('LegalCreatorPage', () => {
  it('[AC-005-01] renders the creator legal mentions sections', async () => {
    await TestBed.configureTestingModule({
      imports: [LegalCreatorPage],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(LegalCreatorPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Creator legal mentions');
    expect(text).toContain('1. Eligibility');
    expect(text).toContain('CIN');
    expect(text).toContain('5. Account deletion');
  });
});
