import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppCombobox } from './combobox.component';

describe('AppCombobox', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppCombobox] })
      .overrideComponent(AppCombobox, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppCombobox);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
