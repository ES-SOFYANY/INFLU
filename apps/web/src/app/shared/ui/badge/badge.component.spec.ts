import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppBadge } from './badge.component';

describe('AppBadge', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppBadge] })
      .overrideComponent(AppBadge, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppBadge);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
