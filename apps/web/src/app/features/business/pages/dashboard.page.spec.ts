import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessDashboardPage } from './dashboard.page';

describe('BusinessDashboardPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessDashboardPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessDashboardPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessDashboardPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
