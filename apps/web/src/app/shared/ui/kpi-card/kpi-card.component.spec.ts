import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppKpiCard } from './kpi-card.component';

describe('AppKpiCard', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppKpiCard] })
      .overrideComponent(AppKpiCard, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppKpiCard);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
