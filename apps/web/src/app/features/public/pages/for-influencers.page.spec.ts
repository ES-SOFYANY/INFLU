import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ForInfluencersPage } from './for-influencers.page';

describe('ForInfluencersPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [ForInfluencersPage, TranslateModule.forRoot()],
    })
      .overrideComponent(ForInfluencersPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(ForInfluencersPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
