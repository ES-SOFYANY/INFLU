import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { BusinessApiService } from '../data/business-api.service';

type CampaignScope =
  | 'BRANDING'
  | 'VISIBILITY_AWARENESS'
  | 'POSITIONING_STORYTELLING'
  | 'NEW_PRODUCT_LAUNCH'
  | 'PROMOTIONS'
  | 'EVENT_PROMOTION'
  | 'ENGAGEMENT_INTERACTIONS';

interface ScopeOption {
  readonly value: CampaignScope;
  readonly label: string;
}

interface Bubble {
  readonly id: string;
  readonly role: 'USER' | 'ASSISTANT';
  readonly content: string;
}

const SCOPE_OPTIONS: readonly ScopeOption[] = [
  { value: 'BRANDING', label: 'Branding' },
  { value: 'VISIBILITY_AWARENESS', label: 'Visibility / Awareness' },
  { value: 'POSITIONING_STORYTELLING', label: 'Positioning / Storytelling' },
  { value: 'NEW_PRODUCT_LAUNCH', label: 'New Product Or Service Launch' },
  { value: 'PROMOTIONS', label: 'Promotions (Flash Sales, etc.)' },
  { value: 'EVENT_PROMOTION', label: 'Event Promotion' },
  { value: 'ENGAGEMENT_INTERACTIONS', label: 'Engagement & Interactions' },
];

const FIRST_QUESTION =
  'What kind of campaign would you like to launch, and what scope are you aiming for?';

/**
 * US-110 — New AI Campaign (`/business/ai-campaign`).
 * Conversational chat with multi-select first question.
 */
@Component({
  selector: 'app-business-ai-campaign-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      id="main"
      role="main"
      style="flex:1;padding:var(--space-8);max-width:880px;display:flex;flex-direction:column;height:calc(100vh - 64px);"
    >
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <div>
          <h1 style="font-size:var(--text-h1);font-weight:700;">New AI Campaign</h1>
          <p style="color:var(--text-muted);font-size:var(--text-xs);">
            Step 1 of 9 — let's define your campaign
          </p>
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
        @for (b of bubbles(); track b.id; let first = $first) {
          @if (b.role === 'ASSISTANT') {
            <div class="chat-bubble chat-bubble-ai" data-testid="bubble-assistant">
              <span
                class="avatar avatar-sm"
                style="background:var(--gradient-primary);color:#fff;"
                >🤖</span
              >
              <div>
                <strong
                  style="font-size:var(--text-xs);color:var(--text-muted);display:block;margin-bottom:0.25rem;"
                  >INFLU AI</strong
                >
                <p style="margin-bottom:1rem;">{{ b.content }}</p>
                @if (first && showOptions()) {
                  <div
                    style="display:flex;flex-direction:column;gap:0.5rem;"
                    data-testid="scope-options"
                  >
                    @for (opt of scopeOptions; track opt.value) {
                      <label
                        style="display:flex;gap:0.625rem;align-items:center;font-size:var(--text-small);padding:0.625rem 0.875rem;background:var(--bg-overlay);border-radius:8px;cursor:pointer;border:1px solid var(--border-subtle);"
                      >
                        <input
                          type="checkbox"
                          [attr.data-testid]="'scope-' + opt.value"
                          [checked]="isSelected(opt.value)"
                          (change)="toggleScope(opt.value)"
                        />
                        {{ opt.label }}
                      </label>
                    }
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="chat-bubble chat-bubble-user" data-testid="bubble-user">
              <div>{{ b.content }}</div>
              <span class="avatar avatar-sm">B</span>
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
          placeholder="Add details or skip with Send…"
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
          aria-label="Send"
        >
          ✈
        </button>
      </form>
    </main>
  `,
})
export class BusinessAiCampaignPage implements OnInit {
  private readonly api = inject(BusinessApiService);
  private readonly router = inject(Router);

  protected readonly scopeOptions = SCOPE_OPTIONS;

  protected readonly sessionId = signal<string | null>(null);
  protected readonly bubbles = signal<readonly Bubble[]>([]);
  protected readonly selectedScopes = signal<readonly CampaignScope[]>([]);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly showOptions = signal(true);

  protected readonly sendDisabled = computed(() => {
    if (!this.sessionId() || this.sending()) return true;
    return this.draft().trim().length === 0 && this.selectedScopes().length === 0;
  });

  ngOnInit(): void {
    this.startSession();
  }

  protected isSelected(value: CampaignScope): boolean {
    return this.selectedScopes().includes(value);
  }

  protected toggleScope(value: CampaignScope): void {
    this.selectedScopes.update((arr) =>
      arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    );
  }

  protected onSubmit(): void {
    const id = this.sessionId();
    if (!id || this.sending()) return;
    const text = this.draft().trim();
    const scopes = this.selectedScopes();
    if (text.length === 0 && scopes.length === 0) return;

    const userContent =
      text.length > 0
        ? text
        : scopes.map((s) => SCOPE_OPTIONS.find((o) => o.value === s)?.label ?? s).join(', ');
    this.bubbles.update((b) => [
      ...b,
      { id: `u-${Date.now()}`, role: 'USER', content: userContent },
    ]);
    this.sending.set(true);
    this.showOptions.set(false);

    const body: { content?: string; selectedScopes?: readonly CampaignScope[] } = {};
    if (text.length > 0) body.content = text;
    if (scopes.length > 0) body.selectedScopes = scopes;

    this.api.sendAiCampaignMessage(id, body).subscribe({
      next: (res) => {
        this.bubbles.update((b) => [
          ...b,
          {
            id: res.aiResponse.id ?? `a-${Date.now()}`,
            role: 'ASSISTANT',
            content: res.aiResponse.content,
          },
        ]);
        this.draft.set('');
        this.selectedScopes.set([]);
        this.sending.set(false);
        if (res.campaign) {
          this.router.navigate(['/business/ai-manager']);
        }
      },
      error: () => {
        this.sending.set(false);
      },
    });
  }

  protected onRestart(): void {
    this.bubbles.set([]);
    this.selectedScopes.set([]);
    this.draft.set('');
    this.sessionId.set(null);
    this.showOptions.set(true);
    this.startSession();
  }

  private startSession(): void {
    this.api.startAiCampaignSession().subscribe({
      next: (res) => {
        this.sessionId.set(res.sessionId);
        this.bubbles.set([
          {
            id: `a-${res.sessionId}`,
            role: 'ASSISTANT',
            content: res.firstMessage || FIRST_QUESTION,
          },
        ]);
      },
    });
  }
}
