import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import type { SchemaNotificationDto } from '@my-app/shared-types';

import { NotificationsApiService } from './notifications-api.service';

const TYPE_BADGE: Record<string, string> = {
  APPLICATION_ACCEPTED: 'badge-success',
  APPLICATION_REJECTED: 'badge-danger',
  BRIEF_RECEIVED: 'badge-info',
  CONTENT_MODIFICATION_REQUESTED: 'badge-warning',
  DELIVERABLE_VALIDATED: 'badge-success',
  PAYMENT_RECEIVED: 'badge-success',
  MESSAGE_RECEIVED: 'badge-info',
  CIN_VALIDATED: 'badge-success',
  OPPORTUNITY_EXPIRING: 'badge-warning',
  AI_COACH_RECOMMENDATION: 'badge-info',
  APPLICATION_RECEIVED: 'badge-info',
  DELIVERABLE_SUBMITTED: 'badge-info',
  PAYMENT_COMPLETED_OR_FAILED: 'badge-info',
  NEW_BRAND_LINKED: 'badge-success',
};

/**
 * US-204 — Header notifications bell.
 *
 * - Bell button (aria-label="Notifications") opens a dropdown panel.
 * - On open: GET /notifications?unreadOnly=false&limit=10.
 * - Each item shows: type badge, title, message, isRead, relative createdAt.
 * - Clicking a notification: POST /notifications/{id}/read, then navigate to
 *   `link` if present, then close the panel.
 */
@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="position:relative;" #root>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        aria-label="Notifications"
        data-testid="notifications-bell"
        [attr.aria-expanded]="open()"
        aria-haspopup="dialog"
        (click)="toggle()"
      >
        🔔
        @if (unreadCount() > 0) {
          <span
            data-testid="notifications-unread-badge"
            style="display:inline-block;margin-inline-start:0.25rem;background:var(--brand-primary,#7c3aed);color:#fff;border-radius:9999px;padding:0 0.4rem;font-size:0.7rem;line-height:1.2rem;"
          >
            {{ unreadCount() }}
          </span>
        }
      </button>

      @if (open()) {
        <div
          role="dialog"
          aria-label="Notifications"
          data-testid="notifications-panel"
          style="position:absolute;top:100%;inset-inline-end:0;margin-top:0.25rem;width:360px;max-height:480px;overflow:auto;background:var(--bg-card,#fff);border:1px solid var(--border-default,#e5e7eb);border-radius:0.5rem;z-index:60;box-shadow:0 10px 25px rgba(0,0,0,.12);"
        >
          <div
            style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;border-bottom:1px solid var(--border-default,#e5e7eb);"
          >
            <strong>Notifications</strong>
            @if (items().length > 0) {
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                data-testid="notifications-mark-all-read"
                (click)="markAllAsRead()"
              >
                Mark all as read
              </button>
            }
          </div>

          @if (loading()) {
            <div data-testid="notifications-loading" role="status" style="padding:1rem;">
              Loading…
            </div>
          } @else if (errorMessage()) {
            <div
              role="alert"
              data-testid="notifications-error"
              style="padding:1rem;color:var(--text-danger,#b91c1c);"
            >
              {{ errorMessage() }}
            </div>
          } @else if (items().length === 0) {
            <div data-testid="notifications-empty" role="status" style="padding:1rem;color:var(--text-secondary,#6b7280);">
              No notifications yet.
            </div>
          } @else {
            <ul style="list-style:none;margin:0;padding:0;">
              @for (n of items(); track n.id) {
                <li>
                  <button
                    type="button"
                    [attr.data-testid]="'notifications-item-' + n.id"
                    [attr.data-unread]="!n.isRead"
                    (click)="onClickItem(n)"
                    style="display:flex;flex-direction:column;align-items:flex-start;gap:0.25rem;width:100%;text-align:start;padding:0.6rem 0.75rem;border:none;background:transparent;border-bottom:1px solid var(--border-default,#e5e7eb);cursor:pointer;color:inherit;"
                    [style.background]="n.isRead ? 'transparent' : 'var(--bg-subtle,#f5f3ff)'"
                  >
                    <span style="display:flex;align-items:center;gap:0.4rem;width:100%;">
                      <span class="badge {{ badgeClass(n.type) }}" data-testid="notifications-item-type">
                        {{ formatType(n.type) }}
                      </span>
                      <span style="font-weight:600;flex:1;">{{ n.title }}</span>
                      <span style="font-size:0.75rem;color:var(--text-secondary,#6b7280);" data-testid="notifications-item-time">
                        {{ relativeTime(n.createdAt) }}
                      </span>
                    </span>
                    <span style="font-size:0.85rem;color:var(--text-secondary,#6b7280);">{{ n.message }}</span>
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationsBellComponent {
  private readonly api = inject(NotificationsApiService);
  private readonly router = inject(Router);

  protected readonly open = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly items = signal<readonly SchemaNotificationDto[]>([]);
  protected readonly unreadCount = signal(0);

  @ViewChild('root') private rootRef?: ElementRef<HTMLElement>;

  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) this.fetch();
  }

  protected onClickItem(n: SchemaNotificationDto): void {
    if (!n.isRead) {
      this.api.markAsRead(n.id).subscribe({
        next: () => {
          this.items.update((arr) =>
            arr.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
          );
          this.unreadCount.update((c) => Math.max(0, c - 1));
        },
        error: () => undefined,
      });
    }
    this.open.set(false);
    if (n.link) {
      void this.router.navigateByUrl(n.link);
    }
  }

  protected markAllAsRead(): void {
    const unread = this.items().filter((n) => !n.isRead);
    if (unread.length === 0) return;
    for (const n of unread) {
      this.api.markAsRead(n.id).subscribe({ next: () => undefined, error: () => undefined });
    }
    this.items.update((arr) => arr.map((n) => ({ ...n, isRead: true })));
    this.unreadCount.set(0);
  }

  protected formatType(type: string): string {
    return type
      .toLowerCase()
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  protected badgeClass(type: string): string {
    return TYPE_BADGE[type] ?? 'badge-info';
  }

  protected relativeTime(iso: string): string {
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return iso;
    const diffMs = Date.now() - ts;
    const sec = Math.round(diffMs / 1000);
    if (sec < 60) return `${Math.max(1, sec)}s ago`;
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.round(hr / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toISOString().slice(0, 10);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    const root = this.rootRef?.nativeElement;
    if (!root) return;
    if (this.open() && !root.contains(ev.target as Node)) this.open.set(false);
  }

  private fetch(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.list({ unreadOnly: false, limit: 10 }).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.unreadCount.set(res.unreadCount ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load notifications.');
        this.loading.set(false);
      },
    });
  }
}
