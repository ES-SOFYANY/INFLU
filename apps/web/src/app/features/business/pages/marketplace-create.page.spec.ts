import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessMarketplaceCreatePage } from './marketplace-create.page';

describe('BusinessMarketplaceCreatePage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessMarketplaceCreatePage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessMarketplaceCreatePage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessMarketplaceCreatePage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
