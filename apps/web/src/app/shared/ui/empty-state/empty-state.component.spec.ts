import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppEmptyState } from './empty-state.component';

describe('AppEmptyState', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppEmptyState] })
      .overrideComponent(AppEmptyState, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppEmptyState);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
