import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { BusinessAccountBrandsPage } from './account-brands.page';

describe('BusinessAccountBrandsPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessAccountBrandsPage, TranslateModule.forRoot()],
    })
      .overrideComponent(BusinessAccountBrandsPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessAccountBrandsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
