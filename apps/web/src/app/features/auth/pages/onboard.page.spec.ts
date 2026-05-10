import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { OnboardPage } from './onboard.page';

describe('OnboardPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardPage, TranslateModule.forRoot()],
    })
      .overrideComponent(OnboardPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(OnboardPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
