import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DisabledReasonDirective } from './disabled-reason.directive';

@Component({
  standalone: true,
  imports: [DisabledReasonDirective],
  template: `
    <button
      type="button"
      data-testid="apply-btn"
      [disabled]="isDisabled"
      [appDisabledReason]="
        isDisabled ? 'Complete your profile (CIN+RIB+ICE) to apply' : ''
      "
    >
      Apply
    </button>
  `,
})
class HostCmp {
  isDisabled = true;
}

describe('DisabledReasonDirective (US-206)', () => {
  it('[AC-206-01] disabled button gets aria-describedby pointing to the reason', () => {
    TestBed.configureTestingModule({ imports: [HostCmp] });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector<HTMLButtonElement>('[data-testid="apply-btn"]')!;
    const describedBy = btn.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(btn.title).toContain('Complete your profile');

    // The describing element exists in the DOM and contains the reason.
    const desc = el.ownerDocument.getElementById(describedBy!);
    expect(desc).not.toBeNull();
    expect(desc!.textContent).toContain('Complete your profile (CIN+RIB+ICE) to apply');
  });

  it('[AC-206-02] when the button becomes enabled, aria-describedby and title are dropped', () => {
    TestBed.configureTestingModule({ imports: [HostCmp] });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    fixture.componentInstance.isDisabled = false;
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="apply-btn"]',
    )!;
    expect(btn.getAttribute('aria-describedby')).toBeNull();
    expect(btn.getAttribute('title')).toBeNull();
  });
});
