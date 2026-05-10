import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppDrawer } from './drawer.component';

describe('AppDrawer', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppDrawer] })
      .overrideComponent(AppDrawer, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppDrawer);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
