import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppHeader } from './header.component';

describe('AppHeader', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppHeader] })
      .overrideComponent(AppHeader, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
