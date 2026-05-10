import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppCard } from './card.component';

describe('AppCard', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppCard] })
      .overrideComponent(AppCard, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppCard);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
