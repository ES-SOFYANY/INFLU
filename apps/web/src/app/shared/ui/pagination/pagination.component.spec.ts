import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppPagination } from './pagination.component';

describe('AppPagination', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppPagination] })
      .overrideComponent(AppPagination, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppPagination);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
