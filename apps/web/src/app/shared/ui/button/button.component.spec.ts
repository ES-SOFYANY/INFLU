import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppButton } from './button.component';

describe('AppButton', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppButton] })
      .overrideComponent(AppButton, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppButton);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
