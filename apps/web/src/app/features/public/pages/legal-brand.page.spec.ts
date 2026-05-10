import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { LegalBrandPage } from './legal-brand.page';

describe('LegalBrandPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [LegalBrandPage, TranslateModule.forRoot()],
    })
      .overrideComponent(LegalBrandPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(LegalBrandPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
