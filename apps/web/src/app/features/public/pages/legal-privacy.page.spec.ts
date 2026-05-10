import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LegalPrivacyPage } from './legal-privacy.page';

describe('LegalPrivacyPage', () => {
  it('[AC-006-01] renders the privacy policy sections', async () => {
    await TestBed.configureTestingModule({
      imports: [LegalPrivacyPage],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(LegalPrivacyPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Privacy policy');
    expect(text).toContain('Data we collect');
    expect(text).toContain('Your rights');
    expect(text).toContain('Retention');
    expect(text).toContain('Cookies');
  });
});
