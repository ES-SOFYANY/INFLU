import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Chat message bubble. */
@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center text-sm text-text-secondary">
      <ng-content />
    </span>
  `,
})
export class AppChatBubble {
  readonly variant = input<string>('default');
}
