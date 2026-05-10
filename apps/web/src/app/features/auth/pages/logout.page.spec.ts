import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { LogoutPage } from './logout.page';

describe('LogoutPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutPage, TranslateModule.forRoot()],
    })
      .overrideComponent(LogoutPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(LogoutPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
