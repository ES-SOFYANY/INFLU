import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorSupportPage } from './support.page';

describe('CreatorSupportPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorSupportPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorSupportPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorSupportPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
