import { ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppChatBubble } from './chat-bubble.component';

describe('AppChatBubble', () => {
  it('renders', async () => {
    await TestBed.configureTestingModule({ imports: [AppChatBubble] })
      .overrideComponent(AppChatBubble, { set: { changeDetection: ChangeDetectionStrategy.Default } })
      .compileComponents();
    const fixture = TestBed.createComponent(AppChatBubble);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
