import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CreatorApiService } from '../data/creator-api.service';

interface Bubble {
  readonly id: string;
  readonly role: 'USER' | 'ASSISTANT';
  readonly content: string;
}

/**
 * US-050 / US-051 — AI Coach (`/creator/ai-coach`).
 * Conversational chat: assistant first message in French
 * ("Comment te positionnes-tu en tant qu'influenceur ?"), textarea + Send
 * (disabled while empty), Restart resets to the first question.
 */
@Component({
  selector: 'app-creator-ai-coach-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      id="main"
      role="main"
      style="flex:1;padding:var(--space-8);max-width:900px;display:flex;flex-direction:column;height:calc(100vh - 64px);"
    >
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <span class="avatar" data-testid="creator-avatar">{{ initial() }}</span>
          <div>
            <h1 style="font-size:var(--text-h2);font-weight:700;">My AI coach</h1>
            <p style="color:var(--text-muted);font-size:var(--text-xs);">
              Conversation personnalisée pour {{ creatorName() }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          data-testid="restart-button"
          [disabled]="!sessionId() || sending()"
          (click)="onRestart()"
        >
          ↻ Restart
        </button>
      </div>

      <div
        role="log"
        aria-live="polite"
        data-testid="chat-log"
        style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:1rem;padding:1rem 0;"
      >
        @for (b of bubbles(); track b.id) {
          @if (b.role === 'ASSISTANT') {
            <div class="chat-bubble chat-bubble-ai" data-testid="bubble-assistant">
              <span class="avatar avatar-sm" style="background:var(--gradient-primary);color:#fff;">🤖</span>
              <div>
                <strong
                  style="font-size:var(--text-xs);color:var(--text-muted);display:block;margin-bottom:0.25rem;"
                >
                  Assistant Message
                </strong>
                {{ b.content }}
              </div>
            </div>
          } @else {
            <div class="chat-bubble chat-bubble-user" data-testid="bubble-user">
              <div>{{ b.content }}</div>
              <span class="avatar avatar-sm">{{ initial() }}</span>
            </div>
          }
        }
        @if (sending()) {
          <div class="chat-bubble chat-bubble-ai" data-testid="typing">…</div>
        }
      </div>

      <form
        (ngSubmit)="onSubmit()"
        style="display:flex;gap:0.75rem;align-items:flex-end;border-top:1px solid var(--border-subtle);padding-top:1rem;"
      >
        <textarea
          class="textarea"
          rows="2"
          placeholder="Tape ta réponse…"
          aria-label="Your message"
          data-testid="message-input"
          style="resize:none;"
          [ngModel]="draft()"
          (ngModelChange)="draft.set($event)"
          name="message"
        ></textarea>
        <button
          type="submit"
          class="btn btn-primary"
          data-testid="send-button"
          [attr.aria-disabled]="sendDisabled()"
          [disabled]="sendDisabled()"
          aria-describedby="send-disabled-reason"
          aria-label="Send"
        >
          ✈
        </button>
      </form>
      <p id="send-disabled-reason" class="help-text">Tape un message pour envoyer.</p>
    </main>
  `,
})
export class CreatorAiCoachPage implements OnInit {
  private readonly api = inject(CreatorApiService);

  protected readonly creatorName = signal('Ali');
  protected readonly sessionId = signal<string | null>(null);
  protected readonly bubbles = signal<readonly Bubble[]>([]);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);

  protected readonly initial = computed(() => (this.creatorName() || '?').charAt(0).toUpperCase());

  protected readonly sendDisabled = computed(
    () => this.draft().trim().length === 0 || this.sending() || !this.sessionId(),
  );

  ngOnInit(): void {
    this.startSession();
  }

  protected onSubmit(): void {
    const text = this.draft().trim();
    const id = this.sessionId();
    if (!text || !id || this.sending()) return;
    const userBubble: Bubble = {
      id: `u-${Date.now()}`,
      role: 'USER',
      content: text,
    };
    this.bubbles.update((b) => [...b, userBubble]);
    this.draft.set('');
    this.sending.set(true);
    this.api.sendAiCoachMessage(id, text).subscribe({
      next: (res) => {
        this.bubbles.update((b) => [
          ...b,
          {
            id: res.aiResponse.id ?? `a-${Date.now()}`,
            role: 'ASSISTANT',
            content: res.aiResponse.content,
          },
        ]);
        this.sending.set(false);
      },
      error: () => {
        this.sending.set(false);
      },
    });
  }

  protected onRestart(): void {
    const id = this.sessionId();
    if (!id || this.sending()) return;
    this.api.restartAiCoachSession(id).subscribe({
      next: (res) => {
        this.sessionId.set(res.sessionId);
        this.bubbles.set([
          { id: `a-${res.sessionId}`, role: 'ASSISTANT', content: res.firstMessage },
        ]);
        this.draft.set('');
      },
    });
  }

  private startSession(): void {
    this.api.createAiCoachSession().subscribe({
      next: (res) => {
        this.sessionId.set(res.sessionId);
        this.bubbles.set([
          { id: `a-${res.sessionId}`, role: 'ASSISTANT', content: res.firstMessage },
        ]);
      },
    });
  }
}

