import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { LegalCreatorPage } from './legal-creator.page';

describe('LegalCreatorPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [LegalCreatorPage, TranslateModule.forRoot()],
    })
      .overrideComponent(LegalCreatorPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(LegalCreatorPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
