import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessAccountSettingsPage } from './account-settings.page';

describe('BusinessAccountSettingsPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessAccountSettingsPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessAccountSettingsPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessAccountSettingsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
