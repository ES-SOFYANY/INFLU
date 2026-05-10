import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotFoundPage } from './not-found.page';

describe('NotFoundPage (US-200)', () => {
  function setup() {
    return TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [provideRouter([])],
    })
      .overrideComponent(NotFoundPage, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
  }

  it('[AC-200-01] renders the 404 code, title and a "Back home" link', async () => {
    await setup();
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="error-page"]')!.getAttribute('data-error-code')).toBe(
      '404',
    );
    expect(el.querySelector('[data-testid="error-code"]')!.textContent).toContain('404');
    expect(el.textContent).toContain('Page not found');
    const home = el.querySelector<HTMLAnchorElement>('[data-testid="error-home"]')!;
    expect(home).not.toBeNull();
    expect(home.textContent).toContain('Back home');
  });
});
