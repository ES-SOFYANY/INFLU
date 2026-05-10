import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppSidebar } from './sidebar.component';

describe('AppSidebar', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppSidebar] })
      .overrideComponent(AppSidebar, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppSidebar);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
