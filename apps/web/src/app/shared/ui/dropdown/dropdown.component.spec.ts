import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppDropdown } from './dropdown.component';

describe('AppDropdown', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppDropdown] })
      .overrideComponent(AppDropdown, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppDropdown);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
