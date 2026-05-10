import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy } from '@angular/core';

import { CreatorSupportPage } from './support.page';

describe('CreatorSupportPage (US-080)', () => {
  it('mounts the shared SupportPage', async () => {
    await TestBed.configureTestingModule({
      imports: [CreatorSupportPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .overrideComponent(CreatorSupportPage, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(CreatorSupportPage);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="support-page"]'),
    ).not.toBeNull();
  });
});
