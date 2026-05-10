import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorAccountSettingsPage } from './account-settings.page';

describe('CreatorAccountSettingsPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorAccountSettingsPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorAccountSettingsPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorAccountSettingsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
