import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { RegisterInfluencerPage } from './register-influencer.page';

describe('RegisterInfluencerPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterInfluencerPage, TranslateModule.forRoot()],
    })
      .overrideComponent(RegisterInfluencerPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(RegisterInfluencerPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
