import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  SchemaConversationItemDto,
  SchemaMessageDto,
} from '@my-app/shared-types';

import { MessagingApiService } from '../../../core/api/messaging-api.service';

/**
 * US-150 — Business messaging (`/business/messaging`).
 * Same patterns as the creator messaging (US-060/US-061): Profile / Campaign /
 * Last Message / Actions, filters Search / by brand / by status, EXACT empty
 * state "You don't have any open discussions at the moment.".
 */
@Component({
  selector: 'app-business-messaging-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <h1 style="font-size:var(--text-h1);font-weight:700;">Messaging</h1>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
        Chat with creators and follow up on deliverables.
      </p>

      @if (selected()) {
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          data-testid="msg-back"
          (click)="closeConversation()"
          style="margin-bottom:1rem;"
        >
          ← Back to conversations
        </button>

        <div
          class="card"
          data-testid="msg-detail"
          style="display:flex;flex-direction:column;height:calc(100vh - 220px);min-height:480px;padding:0;"
        >
          <header
            style="padding:1rem;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;gap:0.75rem;"
          >
            <span class="avatar avatar-sm">{{ initial(selected()!.profile.name) }}</span>
            <div>
              <strong>{{ selected()!.profile.name }}</strong>
              @if (selected()!.campaign; as c) {
                <div style="color:var(--text-muted);font-size:var(--text-xs);">{{ c.name }}</div>
              }
            </div>
          </header>

          <div
            role="log"
            aria-live="polite"
            data-testid="msg-log"
            style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;"
          >
            @if (messagesLoading()) {
              <p data-testid="msg-loading" role="status">Loading…</p>
            } @else if (messagesError()) {
              <div class="alert alert-danger" role="alert" data-testid="msg-error">
                {{ messagesError() }}
              </div>
            } @else {
              @for (m of messages(); track m.id) {
                <div
                  class="chat-bubble"
                  data-testid="msg-bubble"
                  [class.chat-bubble-user]="isMine(m)"
                  [class.chat-bubble-ai]="!isMine(m)"
                >
                  <div>{{ m.content }}</div>
                </div>
              }
            }
          </div>

          <form
            (ngSubmit)="onSend()"
            style="display:flex;gap:0.5rem;padding:1rem;border-top:1px solid var(--border-subtle);"
          >
            <input
              type="text"
              class="input"
              placeholder="Type a message…"
              aria-label="Message"
              data-testid="msg-input"
              [formControl]="composer"
              style="flex:1;"
            />
            <button
              type="submit"
              class="btn btn-primary"
              data-testid="msg-send"
              [disabled]="composer.invalid || sending()"
            >
              Send
            </button>
          </form>
        </div>
      } @else {
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.5rem;">
          <input
            type="search"
            class="input"
            placeholder="Search…"
            aria-label="Search"
            data-testid="msg-search"
            style="max-width:280px;"
            [ngModel]="search()"
            (ngModelChange)="onSearch($event)"
          />
          <select
            class="select"
            aria-label="Filter by creator"
            data-testid="msg-brand"
            style="max-width:200px;"
            [ngModel]="brand()"
            (ngModelChange)="onBrand($event)"
          >
            <option value="">Filter by creator</option>
            @for (b of brandOptions(); track b.id) {
              <option [value]="b.id">{{ b.name }}</option>
            }
          </select>
          <select
            class="select"
            aria-label="Filter by status"
            data-testid="msg-status"
            style="max-width:200px;"
            [ngModel]="status()"
            (ngModelChange)="onStatus($event)"
          >
            <option value="">Filter by status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        @if (loading()) {
          <div class="card" data-testid="msg-list-loading" role="status">Loading…</div>
        } @else if (errorMessage()) {
          <div class="alert alert-danger" role="alert" data-testid="msg-list-error">
            {{ errorMessage() }}
          </div>
        } @else if (conversations().length === 0) {
          <div class="card" style="padding:0;" data-testid="msg-empty">
            <div class="empty-state" role="status">
              <div class="empty-illust">💬</div>
              <h2 class="empty-title">You don't have any open discussions at the moment.</h2>
              <p class="empty-desc">
                When a creator applies to one of your opportunities, the conversation will appear
                here.
              </p>
            </div>
          </div>
        } @else {
          <table class="table" data-testid="msg-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Campaign</th>
                <th>Last Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of conversations(); track c.id) {
                <tr data-testid="msg-row">
                  <td>
                    <div style="display:flex;gap:0.5rem;align-items:center;">
                      <span class="avatar avatar-sm">{{ initial(c.profile.name) }}</span>
                      {{ c.profile.name }}
                    </div>
                  </td>
                  <td>{{ c.campaign?.name ?? '—' }}</td>
                  <td style="color:var(--text-secondary);">
                    {{ c.lastMessage?.content ?? '—' }}
                  </td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      data-testid="msg-open"
                      (click)="openConversation(c)"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      }
    </main>
  `,
})
export class BusinessMessagingPage implements OnInit {
  private readonly api = inject(MessagingApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly conversations = signal<readonly SchemaConversationItemDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly brand = signal('');
  protected readonly status = signal<'' | 'OPEN' | 'CLOSED'>('');

  protected readonly selected = signal<SchemaConversationItemDto | null>(null);
  protected readonly messages = signal<readonly SchemaMessageDto[]>([]);
  protected readonly messagesLoading = signal(false);
  protected readonly messagesError = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly currentUserId = signal<string | null>(null);

  protected readonly composer = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, nonBlank],
  });

  protected readonly brandOptions = computed(() => {
    const seen = new Map<string, string>();
    for (const c of this.conversations()) seen.set(c.profile.id, c.profile.name);
    return Array.from(seen, ([id, name]) => ({ id, name }));
  });

  private pendingOpenId: string | null = null;

  ngOnInit(): void {
    const initial = this.route.snapshot.queryParamMap.get('conversationId');
    if (initial) this.pendingOpenId = initial;
    this.load();
  }

  protected onSearch(v: string): void {
    this.search.set(v);
    this.load();
  }

  protected onBrand(v: string): void {
    this.brand.set(v);
    this.load();
  }

  protected onStatus(v: '' | 'OPEN' | 'CLOSED'): void {
    this.status.set(v);
    this.load();
  }

  protected initial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  protected isMine(m: SchemaMessageDto): boolean {
    const me = this.currentUserId();
    return me ? m.senderId === me : false;
  }

  protected openConversation(c: SchemaConversationItemDto): void {
    this.selected.set(c);
    this.composer.reset('');
    this.loadMessages(c.id);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { conversationId: c.id },
      queryParamsHandling: 'merge',
    });
  }

  protected closeConversation(): void {
    this.selected.set(null);
    this.messages.set([]);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { conversationId: null },
      queryParamsHandling: 'merge',
    });
  }

  protected onSend(): void {
    if (this.composer.invalid || this.sending()) return;
    const conv = this.selected();
    if (!conv) return;
    const content = this.composer.value.trim();
    if (!content) return;
    this.sending.set(true);
    this.api.postMessage(conv.id, { content }).subscribe({
      next: (msg) => {
        this.messages.update((list) => [...list, msg]);
        if (!this.currentUserId()) this.currentUserId.set(msg.senderId);
        this.composer.reset('');
        this.sending.set(false);
      },
      error: () => {
        this.sending.set(false);
        this.messagesError.set('Could not send the message. Please try again.');
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .listConversations({
        q: this.search() || undefined,
        brand: this.brand() || undefined,
        status: this.status() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.conversations.set(res.items);
          this.loading.set(false);
          if (this.pendingOpenId) {
            const target = res.items.find((c) => c.id === this.pendingOpenId);
            this.pendingOpenId = null;
            if (target) this.openConversation(target);
          }
        },
        error: () => {
          this.conversations.set([]);
          this.loading.set(false);
          this.errorMessage.set('Could not load conversations. Please try again.');
        },
      });
  }

  private loadMessages(id: string): void {
    this.messagesLoading.set(true);
    this.messagesError.set(null);
    this.api.listMessages(id, { limit: 100 }).subscribe({
      next: (res) => {
        this.messages.set(res.items);
        this.messagesLoading.set(false);
      },
      error: () => {
        this.messagesLoading.set(false);
        this.messagesError.set('Could not load messages. Please try again.');
      },
    });
  }
}

function nonBlank(control: AbstractControl<string>): ValidationErrors | null {
  const v = control.value;
  return typeof v === 'string' && v.trim().length > 0 ? null : { required: true };
}
