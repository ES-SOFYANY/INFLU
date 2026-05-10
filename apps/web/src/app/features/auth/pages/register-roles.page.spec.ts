import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RegisterRolesPage } from './register-roles.page';

describe('RegisterRolesPage', () => {
  let fixture: ComponentFixture<RegisterRolesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterRolesPage],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterRolesPage);
    fixture.detectChanges();
  });

  it('[AC-015-01] renders the title, subtitle and 4 role cards', () => {
    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent ?? '';
    expect(text).toContain('Create your INFLU account');
    expect(text).toContain(
      'Join thousands of influencers and brands using INFLU to collaborate and grow together.',
    );
    expect(el.querySelectorAll('article[role="listitem"]').length).toBe(4);
    expect(text).toContain("I'm an Influencer");
    expect(text).toContain("We're a Small Business");
    expect(text).toContain('We are a Brand');
    expect(text).toContain('We are an Agency');
  });

  it('[AC-015-02] influencer card routes to /auth/register/influencer', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '[data-testid="role-influencer"]',
    )!;
    expect(link.getAttribute('href')).toBe('/auth/register/influencer');
  });

  it('[AC-015-03] business/brand/agency cards route to /auth/register/business', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(
      el.querySelector('[data-testid="role-small-business"]')?.getAttribute('href'),
    ).toBe('/auth/register/business');
    expect(
      el.querySelector('[data-testid="role-brand"]')?.getAttribute('href'),
    ).toBe('/auth/register/business');
    expect(
      el.querySelector('[data-testid="role-agency"]')?.getAttribute('href'),
    ).toBe('/auth/register/business');
  });

  it('[AC-015-04] exposes a "Let connect now!" link to /auth/login', () => {
    const el = fixture.nativeElement as HTMLElement;
    const link = Array.from(el.querySelectorAll<HTMLAnchorElement>('a')).find(
      (a) => a.textContent?.trim() === 'Let connect now!',
    );
    expect(link).withContext('Let connect now! link').toBeDefined();
    expect(link?.getAttribute('href')).toBe('/auth/login');
  });
});
