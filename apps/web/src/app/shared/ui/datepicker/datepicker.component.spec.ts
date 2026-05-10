import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppDatepicker } from './datepicker.component';

describe('AppDatepicker', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppDatepicker] })
      .overrideComponent(AppDatepicker, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppDatepicker);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
