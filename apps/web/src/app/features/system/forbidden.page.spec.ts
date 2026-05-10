import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ForbiddenPage } from './forbidden.page';

describe('ForbiddenPage (US-201)', () => {
  it('[AC-201-01] renders the 403 page with "Access denied" message and home link', async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenPage],
      providers: [provideRouter([])],
    })
      .overrideComponent(ForbiddenPage, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="error-page"]')!.getAttribute('data-error-code')).toBe(
      '403',
    );
    expect(el.textContent).toContain('Access denied');
    expect(el.querySelector('[data-testid="error-home"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="error-back"]')).not.toBeNull();
  });
});
