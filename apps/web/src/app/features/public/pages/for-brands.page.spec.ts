import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ForBrandsPage } from './for-brands.page';

describe('ForBrandsPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [ForBrandsPage, TranslateModule.forRoot()],
    })
      .overrideComponent(ForBrandsPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(ForBrandsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
