import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { RegisterBusinessPage } from './register-business.page';

describe('RegisterBusinessPage (US-018 redirect)', () => {
  it('redirects to /auth/onboard?type=brand by default', () => {
    TestBed.configureTestingModule({
      imports: [RegisterBusinessPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    });
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(RegisterBusinessPage);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/auth/onboard'], { queryParams: { type: 'brand' } });
  });

  it('forwards a recognized ?type=agency query param', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [RegisterBusinessPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ type: 'agency' }) } },
        },
      ],
    });
    const router = TestBed.inject(Router);
    const spy = spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(RegisterBusinessPage);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/auth/onboard'], { queryParams: { type: 'agency' } });
  });
});
