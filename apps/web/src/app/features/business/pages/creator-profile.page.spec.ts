import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessCreatorProfilePage } from './creator-profile.page';

describe('BusinessCreatorProfilePage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessCreatorProfilePage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessCreatorProfilePage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessCreatorProfilePage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
