import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { RegisterBusinessPage } from './register-business.page';

describe('RegisterBusinessPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterBusinessPage, TranslateModule.forRoot()],
    })
      .overrideComponent(RegisterBusinessPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(RegisterBusinessPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
