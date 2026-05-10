import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorMyAccountPage } from './my-account.page';

describe('CreatorMyAccountPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorMyAccountPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorMyAccountPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorMyAccountPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
