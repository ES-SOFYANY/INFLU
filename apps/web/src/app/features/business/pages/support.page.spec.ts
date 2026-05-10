import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessSupportPage } from './support.page';

describe('BusinessSupportPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessSupportPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessSupportPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessSupportPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
