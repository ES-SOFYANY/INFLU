import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { LandingPage } from './landing.page';

describe('LandingPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage, TranslateModule.forRoot()],
    })
      .overrideComponent(LandingPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
