import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppTabs } from './tabs.component';

describe('AppTabs', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppTabs] })
      .overrideComponent(AppTabs, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppTabs);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
