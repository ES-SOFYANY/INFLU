import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorMarketplaceListPage } from './marketplace-list.page';

describe('CreatorMarketplaceListPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorMarketplaceListPage, TranslateModule.forRoot()],
    })
      .overrideComponent(CreatorMarketplaceListPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorMarketplaceListPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
