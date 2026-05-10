import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppTableGridToggle } from './table-grid-toggle.component';

describe('AppTableGridToggle', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppTableGridToggle] })
      .overrideComponent(AppTableGridToggle, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppTableGridToggle);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
