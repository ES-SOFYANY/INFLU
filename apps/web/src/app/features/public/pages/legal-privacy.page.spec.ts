import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { LegalPrivacyPage } from './legal-privacy.page';

describe('LegalPrivacyPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [LegalPrivacyPage, TranslateModule.forRoot()],
    })
      .overrideComponent(LegalPrivacyPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(LegalPrivacyPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
