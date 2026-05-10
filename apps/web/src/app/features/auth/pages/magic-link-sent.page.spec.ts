import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { MagicLinkSentPage } from './magic-link-sent.page';

describe('MagicLinkSentPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [MagicLinkSentPage, TranslateModule.forRoot()],
    })
      .overrideComponent(MagicLinkSentPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(MagicLinkSentPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
