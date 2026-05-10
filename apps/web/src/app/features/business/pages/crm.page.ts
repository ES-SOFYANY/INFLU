import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import type { SchemaCrmListDto } from '@my-app/shared-types';

import { BusinessApiService } from '../data/business-api.service';

interface CrmFormShape {
  title: FormControl<string>;
  description: FormControl<string>;
}

/**
 * US-140 — CRM lists (`/business/crm`).
 * - Empty state with EXACT "No CRM list has been created yet." + Create button.
 * - When lists exist: searchable card grid.
 * US-141 — Create / edit / delete a list (modal "Create new CRM" with Title +
 *   Description, both required; kebab menu on each card for edit/delete).
 */
@Component({
  selector: 'app-business-crm-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);">
      <h1 style="font-size:var(--text-h1);font-weight:700;">CRM</h1>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem;">
        Manage your customer relationships effectively with our comprehensive CRM tools.
      </p>

      <div
        style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.5rem;justify-content:space-between;align-items:center;"
      >
        <input
          type="search"
          class="input"
          placeholder="Search…"
          aria-label="Search"
          data-testid="crm-search"
          style="max-width:280px;"
          [ngModel]="search()"
          (ngModelChange)="onSearch($event)"
        />
        <button
          type="button"
          class="btn btn-primary"
          data-testid="crm-create"
          (click)="openCreate()"
        >
          + Create New CRM
        </button>
      </div>

      @if (loading()) {
        <div class="card" data-testid="crm-loading" role="status">Loading…</div>
      } @else if (errorMessage()) {
        <div class="alert alert-danger" role="alert" data-testid="crm-error">
          {{ errorMessage() }}
        </div>
      } @else if (lists().length === 0) {
        <div class="card" style="padding:0;" data-testid="crm-empty">
          <div class="empty-state" role="status">
            <div class="empty-illust" aria-label="No data found">📇</div>
            <h2 class="empty-title">No CRM list has been created yet.</h2>
            <p class="empty-desc">
              Segment creators into shortlists by campaign or theme to keep your sourcing
              organized.
            </p>
            <button
              type="button"
              class="btn btn-primary"
              style="margin-top:1rem;"
              data-testid="crm-create-empty"
              (click)="openCreate()"
            >
              + Create New CRM
            </button>
          </div>
        </div>
      } @else {
        <div
          data-testid="crm-grid"
          style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;"
        >
          @for (l of lists(); track l.id) {
            <article
              class="card"
              data-testid="crm-card"
              style="padding:1rem;display:flex;flex-direction:column;gap:0.5rem;position:relative;"
            >
              <header style="display:flex;justify-content:space-between;align-items:flex-start;">
                <strong>{{ l.title }}</strong>
                <div style="position:relative;">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    aria-label="Open menu"
                    data-testid="crm-kebab"
                    (click)="toggleMenu(l.id)"
                  >
                    ⋮
                  </button>
                  @if (openMenuId() === l.id) {
                    <div
                      role="menu"
                      data-testid="crm-menu"
                      style="position:absolute;right:0;top:100%;background:var(--bg-card);border:1px solid var(--border-default);border-radius:0.5rem;min-width:140px;z-index:10;display:flex;flex-direction:column;"
                    >
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm"
                        role="menuitem"
                        data-testid="crm-edit"
                        (click)="openEdit(l)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm"
                        role="menuitem"
                        data-testid="crm-delete"
                        (click)="onDelete(l)"
                      >
                        Delete
                      </button>
                    </div>
                  }
                </div>
              </header>
              <p style="color:var(--text-secondary);font-size:var(--text-small);">
                {{ l.description }}
              </p>
              <p style="color:var(--text-muted);font-size:var(--text-xs);">
                {{ l.creatorsCount }} creator{{ l.creatorsCount === 1 ? '' : 's' }}
              </p>
            </article>
          }
        </div>
      }

      @if (modalOpen()) {
        <div
          role="presentation"
          data-testid="crm-modal-backdrop"
          style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:80;display:flex;align-items:center;justify-content:center;padding:1rem;"
          (click)="onBackdrop($event)"
          (keydown)="onBackdropKey($event)"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-modal-title"
            data-testid="crm-modal"
            style="background:var(--bg-card);border-radius:0.75rem;max-width:520px;width:100%;padding:1.5rem;display:flex;flex-direction:column;gap:1rem;"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <header>
              <h2 id="crm-modal-title" style="font-weight:700;font-size:var(--text-h2);">
                {{ editing() ? 'Edit CRM' : 'Create new CRM' }}
              </h2>
              <p style="color:var(--text-secondary);font-size:var(--text-small);margin-top:0.25rem;">
                Initialize a new shortlist of creators.
              </p>
            </header>
            <form [formGroup]="form" (ngSubmit)="onSubmit()" style="display:flex;flex-direction:column;gap:0.75rem;">
              <div>
                <label class="label label-required" for="crm-title">Title</label>
                <input
                  id="crm-title"
                  class="input"
                  formControlName="title"
                  data-testid="crm-modal-title-input"
                  placeholder="e.g. Beauty MA Q2"
                />
                @if (form.controls.title.touched && form.controls.title.invalid) {
                  <p class="help-text" data-testid="crm-modal-title-error">Title is required.</p>
                }
              </div>
              <div>
                <label class="label label-required" for="crm-desc">Description</label>
                <textarea
                  id="crm-desc"
                  class="textarea"
                  rows="3"
                  formControlName="description"
                  data-testid="crm-modal-desc-input"
                  placeholder="What is this list for?"
                ></textarea>
                @if (form.controls.description.touched && form.controls.description.invalid) {
                  <p class="help-text" data-testid="crm-modal-desc-error">
                    Description is required.
                  </p>
                }
              </div>
              @if (modalError()) {
                <div class="alert alert-danger" role="alert" data-testid="crm-modal-error">
                  {{ modalError() }}
                </div>
              }
              <footer style="display:flex;gap:0.5rem;justify-content:flex-end;">
                <button
                  type="button"
                  class="btn btn-ghost"
                  data-testid="crm-modal-cancel"
                  (click)="closeModal()"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  data-testid="crm-modal-submit"
                  [disabled]="form.invalid || submitting()"
                >
                  {{ editing() ? 'Save' : 'Create CRM' }}
                </button>
              </footer>
            </form>
          </div>
        </div>
      }
    </main>
  `,
})
export class BusinessCrmPage implements OnInit {
  private readonly api = inject(BusinessApiService);

  protected readonly lists = signal<readonly SchemaCrmListDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly search = signal('');

  protected readonly modalOpen = signal(false);
  protected readonly editing = signal<SchemaCrmListDto | null>(null);
  protected readonly modalError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly openMenuId = signal<string | null>(null);

  protected readonly form = new FormGroup<CrmFormShape>({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly displayLists = computed(() => this.lists());

  ngOnInit(): void {
    this.load();
  }

  protected onSearch(v: string): void {
    this.search.set(v);
    this.load();
  }

  protected toggleMenu(id: string): void {
    this.openMenuId.update((cur) => (cur === id ? null : id));
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.form.reset({ title: '', description: '' });
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  protected openEdit(l: SchemaCrmListDto): void {
    this.editing.set(l);
    this.form.reset({ title: l.title, description: l.description });
    this.modalError.set(null);
    this.modalOpen.set(true);
    this.openMenuId.set(null);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
    this.editing.set(null);
    this.submitting.set(false);
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModal();
  }

  protected onBackdropKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closeModal();
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.modalError.set(null);
    const dto = {
      title: this.form.controls.title.value.trim(),
      description: this.form.controls.description.value.trim(),
    };
    const editing = this.editing();
    const op$ = editing
      ? this.api.updateCrmList(editing.id, dto)
      : this.api.createCrmList(dto);
    op$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeModal();
        this.load();
      },
      error: () => {
        this.submitting.set(false);
        this.modalError.set('Could not save the list. Please try again.');
      },
    });
  }

  protected onDelete(l: SchemaCrmListDto): void {
    this.openMenuId.set(null);
    if (typeof confirm === 'function' && !confirm(`Delete "${l.title}"?`)) return;
    this.api.deleteCrmList(l.id).subscribe({
      next: () => this.load(),
      error: () => this.errorMessage.set('Could not delete the list. Please try again.'),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.listCrmLists({ q: this.search() || undefined, limit: 50 }).subscribe({
      next: (res) => {
        this.lists.set(res.items);
        this.loading.set(false);
      },
      error: () => {
        this.lists.set([]);
        this.loading.set(false);
        this.errorMessage.set('Could not load CRM lists. Please try again.');
      },
    });
  }
}
