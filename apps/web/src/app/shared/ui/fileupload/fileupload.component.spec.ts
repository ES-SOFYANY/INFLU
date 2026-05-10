import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppFileupload } from './fileupload.component';

describe('AppFileupload', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppFileupload] })
      .overrideComponent(AppFileupload, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppFileupload);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
