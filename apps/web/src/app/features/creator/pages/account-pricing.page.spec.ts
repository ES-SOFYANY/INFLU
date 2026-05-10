import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorAccountPricingPage } from './account-pricing.page';

describe('CreatorAccountPricingPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorAccountPricingPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorAccountPricingPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorAccountPricingPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
