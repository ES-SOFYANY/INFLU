import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppEmptyState } from './empty-state.component';

@Component({
  standalone: true,
  imports: [AppEmptyState],
  template: `
    <app-empty-state
      illustration="📋"
      title="No reports yet"
      description="Use the button to report an issue."
    >
      <button data-testid="empty-cta">Report</button>
    </app-empty-state>
  `,
})
class HostCmp {}

describe('AppEmptyState (US-205)', () => {
  it('renders illustration, title, description and projects CTA content', async () => {
    await TestBed.configureTestingModule({ imports: [HostCmp] })
      .overrideComponent(AppEmptyState, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="empty-state"]')).not.toBeNull();
    expect(el.textContent).toContain('No reports yet');
    expect(el.textContent).toContain('Use the button to report an issue.');
    expect(el.querySelector('[data-testid="empty-cta"]')).not.toBeNull();
  });
});
