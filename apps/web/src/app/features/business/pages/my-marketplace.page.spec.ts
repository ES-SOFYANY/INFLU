import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessMyMarketplacePage } from './my-marketplace.page';

describe('BusinessMyMarketplacePage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessMyMarketplacePage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessMyMarketplacePage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessMyMarketplacePage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
