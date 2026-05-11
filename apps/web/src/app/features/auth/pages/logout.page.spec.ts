import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { LogoutPage } from './logout.page';

describe('LogoutPage', () => {
  let fixture: ComponentFixture<LogoutPage>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(LogoutPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('[AC-014-01] renders the confirmation prompt and Cancel/Logout buttons', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Are you sure you want to logout?');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="cancel-logout"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="confirm-logout"]')).not.toBeNull();
  });

  it('[AC-014-02] Cancel calls Location.back()', () => {
    const back = spyOn(TestBed.inject(Location), 'back');
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="cancel-logout"]')!
      .click();
    expect(back).toHaveBeenCalled();
  });

  it('[AC-014-03] Logout posts to /auth/logout and redirects to /auth/login', fakeAsync(() => {
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="confirm-logout"]')!
      .click();
    const req = http.expectOne('/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush(null);
    tick();
    expect(navSpy).toHaveBeenCalledWith('/auth/login');
  }));
});
