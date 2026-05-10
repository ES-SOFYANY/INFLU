import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppStepper } from './stepper.component';

describe('AppStepper', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppStepper] })
      .overrideComponent(AppStepper, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppStepper);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
