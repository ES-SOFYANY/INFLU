import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppDialog } from './dialog.component';

describe('AppDialog', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppDialog] })
      .overrideComponent(AppDialog, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppDialog);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
