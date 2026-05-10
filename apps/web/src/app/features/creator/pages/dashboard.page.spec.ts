import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorDashboardPage } from './dashboard.page';

describe('CreatorDashboardPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorDashboardPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorDashboardPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorDashboardPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
