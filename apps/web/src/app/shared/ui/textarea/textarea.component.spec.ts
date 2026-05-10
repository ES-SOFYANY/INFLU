import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppTextarea } from './textarea.component';

describe('AppTextarea', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppTextarea] })
      .overrideComponent(AppTextarea, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppTextarea);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
