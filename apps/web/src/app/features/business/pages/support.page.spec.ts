import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy } from '@angular/core';

import { BusinessSupportPage } from './support.page';

describe('BusinessSupportPage (US-180)', () => {
  it('mounts the shared SupportPage', async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessSupportPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .overrideComponent(BusinessSupportPage, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(BusinessSupportPage);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="support-page"]'),
    ).not.toBeNull();
  });
});
