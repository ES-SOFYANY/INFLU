import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SchemaCrmListDto } from '@my-app/shared-types';

import { BusinessApiService } from '../data/business-api.service';
import { CrmAddDialogService } from '../data/crm-add-dialog.service';

/**
 * US-142 — Host modal mounted by `BusinessLayoutPage`. Listens to
 * `CrmAddDialogService` and renders an "Add to CRM" picker. Supports creating a
 * new list inline. Handles 409 ALREADY_IN_LIST as an inline error.
 */
@Component({
  selector: 'app-crm-add-dialog-host',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state.isOpen()) {
      <div
        role="presentation"
        data-testid="crm-add-backdrop"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:80;display:flex;align-items:center;justify-content:center;padding:1rem;"
        (click)="onBackdrop($event)"
        (keydown)="onBackdropKey($event)"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="crm-add-title"
          data-testid="crm-add-dialog"
          style="background:var(--bg-card);border-radius:0.75rem;max-width:480px;width:100%;padding:1.5rem;display:flex;flex-direction:column;gap:1rem;"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <header>
            <h2 id="crm-add-title" style="font-weight:700;font-size:var(--text-h2);">
              Add to CRM
            </h2>
            <p style="color:var(--text-secondary);font-size:var(--text-small);margin-top:0.25rem;">
              Pick an existing list or create a new one.
            </p>
          </header>

          @if (loading()) {
            <p data-testid="crm-add-loading" role="status">Loading…</p>
          } @else {
            <div>
              <label for="crm-add-select" class="label">Select a CRM list</label>
              <select
                id="crm-add-select"
                class="select"
                data-testid="crm-add-select"
                [ngModel]="selectedId()"
                (ngModelChange)="selectedId.set($event)"
              >
                <option value="">— Choose —</option>
                @for (l of lists(); track l.id) {
                  <option [value]="l.id">{{ l.title }} ({{ l.creatorsCount }})</option>
                }
              </select>
            </div>

            @if (creatingNew()) {
              <div style="display:flex;flex-direction:column;gap:0.5rem;">
                <label class="label label-required" for="crm-add-new-title">Title</label>
                <input
                  id="crm-add-new-title"
                  class="input"
                  data-testid="crm-add-new-title"
                  [ngModel]="newTitle()"
                  (ngModelChange)="newTitle.set($event)"
                />
                <label class="label label-required" for="crm-add-new-desc">Description</label>
                <textarea
                  id="crm-add-new-desc"
                  class="textarea"
                  rows="2"
                  data-testid="crm-add-new-desc"
                  [ngModel]="newDesc()"
                  (ngModelChange)="newDesc.set($event)"
                ></textarea>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  data-testid="crm-add-new-cancel"
                  (click)="creatingNew.set(false)"
                >
                  Use existing list
                </button>
              </div>
            } @else {
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                data-testid="crm-add-new-toggle"
                (click)="creatingNew.set(true)"
              >
                + Create new list
              </button>
            }

            @if (errorMessage()) {
              <div class="alert alert-danger" role="alert" data-testid="crm-add-error">
                {{ errorMessage() }}
              </div>
            }
          }

          <footer style="display:flex;gap:0.5rem;justify-content:flex-end;">
            <button
              type="button"
              class="btn btn-ghost"
              data-testid="crm-add-cancel"
              (click)="onClose()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              data-testid="crm-add-confirm"
              [disabled]="confirmDisabled()"
              (click)="onConfirm()"
            >
              Confirm
            </button>
          </footer>
        </div>
      </div>
    }
  `,
})
export class CrmAddDialogHostComponent {
  private readonly api = inject(BusinessApiService);
  protected readonly state = inject(CrmAddDialogService);

  protected readonly lists = signal<readonly SchemaCrmListDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly selectedId = signal('');
  protected readonly creatingNew = signal(false);
  protected readonly newTitle = signal('');
  protected readonly newDesc = signal('');
  protected readonly submitting = signal(false);

  protected readonly confirmDisabled = computed(() => {
    if (this.submitting()) return true;
    if (this.creatingNew()) {
      return this.newTitle().trim().length === 0 || this.newDesc().trim().length === 0;
    }
    return this.selectedId().length === 0;
  });

  constructor() {
    effect(
      () => {
        if (this.state.isOpen()) {
          this.loadLists();
        }
      },
      { allowSignalWrites: true },
    );
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.onClose();
  }

  protected onBackdropKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.onClose();
  }

  protected onClose(): void {
    this.state.close(null);
    this.reset();
  }

  protected onConfirm(): void {
    const creatorId = this.state.creatorId();
    if (!creatorId || this.submitting()) return;
    this.errorMessage.set(null);
    this.submitting.set(true);
    if (this.creatingNew()) {
      this.api
        .createCrmList({ title: this.newTitle().trim(), description: this.newDesc().trim() })
        .subscribe({
          next: (created) => this.addToList(created.id, creatorId),
          error: () => {
            this.submitting.set(false);
            this.errorMessage.set('Could not create the list. Please try again.');
          },
        });
    } else {
      this.addToList(this.selectedId(), creatorId);
    }
  }

  private addToList(listId: string, creatorId: string): void {
    this.state.addCreatorToList(listId, creatorId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.state.close({ listId, creatorId });
        this.reset();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const status =
          err && typeof err === 'object' && 'status' in err
            ? (err as { status?: number }).status
            : undefined;
        if (status === 409) {
          this.errorMessage.set('This creator is already in the selected list.');
        } else {
          this.errorMessage.set('Could not add the creator. Please try again.');
        }
      },
    });
  }

  private reset(): void {
    this.lists.set([]);
    this.selectedId.set('');
    this.creatingNew.set(false);
    this.newTitle.set('');
    this.newDesc.set('');
    this.errorMessage.set(null);
    this.submitting.set(false);
    this.loading.set(false);
  }

  /** Loads CRM lists. Triggered by an effect when the dialog opens. */
  private loadLists(): void {
    this.loading.set(true);
    this.api.listCrmLists({ limit: 100 }).subscribe({
      next: (res) => {
        this.lists.set(res.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load CRM lists.');
      },
    });
  }
}
