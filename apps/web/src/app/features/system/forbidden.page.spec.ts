import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ForbiddenPage } from './forbidden.page';

describe('ForbiddenPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenPage, TranslateModule.forRoot()],
    })
      .overrideComponent(ForbiddenPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
