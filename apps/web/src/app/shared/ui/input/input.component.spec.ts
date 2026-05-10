import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppInput } from './input.component';

describe('AppInput', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppInput] })
      .overrideComponent(AppInput, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppInput);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
