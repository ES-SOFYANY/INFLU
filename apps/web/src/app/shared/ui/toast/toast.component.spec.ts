import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppToast } from './toast.component';

describe('AppToast', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppToast] })
      .overrideComponent(AppToast, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppToast);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
