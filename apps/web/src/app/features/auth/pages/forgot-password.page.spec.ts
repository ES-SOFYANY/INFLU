import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ForgotPasswordPage } from './forgot-password.page';

describe('ForgotPasswordPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage, TranslateModule.forRoot()],
    })
      .overrideComponent(ForgotPasswordPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
