import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorMarketplaceDetailPage } from './marketplace-detail.page';

describe('CreatorMarketplaceDetailPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorMarketplaceDetailPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorMarketplaceDetailPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorMarketplaceDetailPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
