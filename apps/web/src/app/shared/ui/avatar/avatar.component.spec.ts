import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppAvatar } from './avatar.component';

describe('AppAvatar', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppAvatar] })
      .overrideComponent(AppAvatar, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppAvatar);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
