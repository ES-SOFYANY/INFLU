import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorReportPage } from './creator-report.page';

describe('CreatorReportPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorReportPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorReportPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorReportPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
