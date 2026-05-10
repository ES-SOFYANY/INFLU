import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppAlert } from './alert.component';

describe('AppAlert', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppAlert] })
      .overrideComponent(AppAlert, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppAlert);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
