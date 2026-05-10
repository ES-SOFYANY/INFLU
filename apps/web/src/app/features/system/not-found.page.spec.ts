import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { NotFoundPage } from './not-found.page';

describe('NotFoundPage', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage, TranslateModule.forRoot()],
    })
      .overrideComponent(NotFoundPage, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
