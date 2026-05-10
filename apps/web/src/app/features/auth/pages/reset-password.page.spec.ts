import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ResetPasswordPage } from './reset-password.page';

describe('ResetPasswordPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage, TranslateModule.forRoot()],
    })
      .overrideComponent(ResetPasswordPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
