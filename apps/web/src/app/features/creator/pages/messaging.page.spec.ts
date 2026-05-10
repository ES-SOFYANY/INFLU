import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorMessagingPage } from './messaging.page';

describe('CreatorMessagingPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorMessagingPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorMessagingPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorMessagingPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
