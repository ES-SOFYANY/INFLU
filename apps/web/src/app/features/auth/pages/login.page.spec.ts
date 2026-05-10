import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { LoginPage } from './login.page';

describe('LoginPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage, TranslateModule.forRoot()],
    })
      .overrideComponent(LoginPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
