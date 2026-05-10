import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessMessagingPage } from './messaging.page';

describe('BusinessMessagingPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessMessagingPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessMessagingPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessMessagingPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
