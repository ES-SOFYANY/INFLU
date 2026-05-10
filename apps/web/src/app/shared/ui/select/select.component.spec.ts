import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppSelect } from './select.component';

describe('AppSelect', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppSelect] })
      .overrideComponent(AppSelect, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppSelect);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
