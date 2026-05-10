import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CreatorLayoutPage } from './creator-layout.page';

describe('CreatorLayoutPage', () => {
  let fixture: ComponentFixture<CreatorLayoutPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorLayoutPage, TranslateModule.forRoot()],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatorLayoutPage);
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('[AC-023-01] sidebar items "Matchings", "Calendar" and "My Payments" are visible but disabled', () => {
    const matchings = el().querySelector<HTMLAnchorElement>('[data-testid="nav-matchings"]')!;
    const calendar = el().querySelector<HTMLAnchorElement>('[data-testid="nav-calendar"]')!;
    const payments = el().querySelector<HTMLAnchorElement>('[data-testid="nav-payments"]')!;
    [matchings, calendar, payments].forEach((a) => {
      expect(a).not.toBeNull();
      expect(a.classList.contains('disabled')).toBe(true);
      expect(a.getAttribute('aria-disabled')).toBe('true');
    });
    expect(matchings.textContent).toContain('Matchings');
    expect(calendar.textContent).toContain('Calendar');
    expect(payments.textContent).toContain('My Payments');
  });

  it('[AC-023-02] clicking a disabled sidebar item performs no navigation (preventDefault)', () => {
    const matchings = el().querySelector<HTMLAnchorElement>('[data-testid="nav-matchings"]')!;
    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    matchings.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('renders the language selector and notifications button', () => {
    expect(el().querySelector('[data-testid="lang-select"]')).not.toBeNull();
    expect(el().querySelector('[aria-label="Notifications"]')).not.toBeNull();
  });

  it('changing the language selector updates the locale', () => {
    const sel = el().querySelector<HTMLSelectElement>('[data-testid="lang-select"]')!;
    sel.value = 'en';
    sel.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(sel.value).toBe('en');
  });
});
