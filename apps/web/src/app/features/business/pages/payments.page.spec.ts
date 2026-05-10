import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessPaymentsPage } from './payments.page';

describe('BusinessPaymentsPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessPaymentsPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessPaymentsPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessPaymentsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
