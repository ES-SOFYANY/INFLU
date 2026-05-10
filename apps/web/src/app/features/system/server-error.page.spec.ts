import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ServerErrorPage } from './server-error.page';

describe('ServerErrorPage (US-202)', () => {
  it('[AC-202-01] renders a generic error page with reload + back home', async () => {
    await TestBed.configureTestingModule({
      imports: [ServerErrorPage],
      providers: [provideRouter([])],
    })
      .overrideComponent(ServerErrorPage, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="error-page"]')!.getAttribute('data-error-code')).toBe(
      '500',
    );
    expect(el.textContent).toContain('Something went wrong');
    expect(el.querySelector('[data-testid="error-reload"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="error-home"]')).not.toBeNull();
  });
});
