import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  SchemaBrandSummaryDto,
  SchemaMarketplaceProductWizardDto,
  SchemaUpdateMarketplaceProductDto,
} from '@my-app/shared-types';

import { BusinessApiService } from '../data/business-api.service';

type Step = 'BRAND_INFO' | 'PRODUCT_DETAILS' | 'ACCEPTANCE_CRITERIA' | 'DELIVERABLES' | 'DATES';
type Platform = 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'TWITTER';
type ContentType = 'reel' | 'post' | 'story' | 'video' | 'short' | 'carousel' | 'live';

const STEPS: readonly { id: Step; letter: string; label: string }[] = [
  { id: 'BRAND_INFO', letter: 'A', label: 'Brand Information' },
  { id: 'PRODUCT_DETAILS', letter: 'B', label: 'Product Details' },
  { id: 'ACCEPTANCE_CRITERIA', letter: 'C', label: 'Acceptance criteria' },
  { id: 'DELIVERABLES', letter: 'D', label: 'Deliverables' },
  { id: 'DATES', letter: 'E', label: 'Dates' },
];

const CONTENT_TYPES_BY_PLATFORM: Record<Platform, readonly ContentType[]> = {
  INSTAGRAM: ['reel', 'post', 'story', 'carousel', 'live'],
  YOUTUBE: ['video', 'short', 'live'],
  TIKTOK: ['video', 'live'],
  TWITTER: ['post'],
};

interface DeliverableForm {
  id: string;
  platform: Platform | '';
  contentType: ContentType | '';
  quantity: number;
  unitPrice: number;
  taggedAccount: string;
  dateReception: string;
  datePublication: string;
}

function emptyDeliverable(): DeliverableForm {
  return {
    id: `local-${Math.random().toString(36).slice(2, 10)}`,
    platform: '',
    contentType: '',
    quantity: 1,
    unitPrice: 0,
    taggedAccount: '',
    dateReception: '',
    datePublication: '',
  };
}

/**
 * US-120 / US-121 — Wizard "Create marketplace product" (5 steps).
 * /business/marketplace/create
 */
@Component({
  selector: 'app-business-marketplace-create-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" role="main" style="flex:1;padding:var(--space-8);max-width:980px;">
      <h1 style="font-size:var(--text-h1);font-weight:700;">Create marketplace product</h1>
      <p style="color:var(--text-secondary);margin-bottom:2rem;">
        Create a new product to offer in the marketplace.
      </p>

      <ol class="stepper" role="list" aria-label="Wizard steps" data-testid="stepper">
        @for (s of steps; track s.id) {
          <li
            class="step"
            [class.active]="currentStep() === s.id"
            [class.completed]="isCompleted(s.id)"
            [attr.aria-current]="currentStep() === s.id ? 'step' : null"
            [attr.data-testid]="'step-' + s.id"
          >
            <span class="step-num">{{ s.letter }}</span>
            <div>
              <div class="step-label">{{ s.label }}</div>
            </div>
          </li>
        }
      </ol>

      @if (errorMessage()) {
        <div class="alert alert-danger" role="alert" data-testid="wizard-error">
          {{ errorMessage() }}
        </div>
      }

      <!-- STEP A — Brand Information -->
      @if (currentStep() === 'BRAND_INFO') {
        <section class="card" data-testid="step-brand-info" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">
            A — Brand Information
          </h2>
          <div style="display:flex;flex-direction:column;gap:1rem;">
            <div>
              <label class="label label-required" for="brandId">Select Brand</label>
              <select
                id="brandId"
                class="select"
                required
                data-testid="input-brandId"
                [ngModel]="brandId()"
                (ngModelChange)="brandId.set($event)"
                name="brandId"
              >
                <option value="">Select a brand…</option>
                @for (b of brands(); track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label label-required" for="brandDescription">Brand description</label>
              <textarea
                id="brandDescription"
                class="textarea"
                rows="4"
                required
                placeholder="Describe the brand context, values, target market…"
                data-testid="input-brandDescription"
                [ngModel]="brandDescription()"
                (ngModelChange)="brandDescription.set($event)"
                name="brandDescription"
              ></textarea>
            </div>
          </div>
        </section>
      }

      <!-- STEP B — Product Details -->
      @if (currentStep() === 'PRODUCT_DETAILS') {
        <section class="card" data-testid="step-product-details" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">
            B — Product Details
          </h2>
          <div style="display:flex;flex-direction:column;gap:1rem;">
            <div>
              <label class="label label-required" for="productName">Product Name</label>
              <input
                id="productName"
                type="text"
                class="input"
                required
                data-testid="input-productName"
                [ngModel]="productName()"
                (ngModelChange)="productName.set($event)"
                name="productName"
              />
            </div>
            <div>
              <label class="label label-required" for="productDescription"
                >Product Description</label
              >
              <textarea
                id="productDescription"
                class="textarea"
                rows="3"
                required
                data-testid="input-productDescription"
                [ngModel]="productDescription()"
                (ngModelChange)="productDescription.set($event)"
                name="productDescription"
              ></textarea>
            </div>
            <div>
              <label class="label label-required" for="requestedContent">Requested Content</label>
              <textarea
                id="requestedContent"
                class="textarea"
                rows="3"
                required
                data-testid="input-requestedContent"
                [ngModel]="requestedContent()"
                (ngModelChange)="requestedContent.set($event)"
                name="requestedContent"
              ></textarea>
            </div>
            <div>
              <label class="label label-required" for="miniScript">Mini Script for Influencer</label>
              <textarea
                id="miniScript"
                class="textarea"
                rows="3"
                required
                data-testid="input-miniScript"
                [ngModel]="miniScript()"
                (ngModelChange)="miniScript.set($event)"
                name="miniScript"
              ></textarea>
            </div>
          </div>
        </section>
      }

      <!-- STEP C — Acceptance criteria -->
      @if (currentStep() === 'ACCEPTANCE_CRITERIA') {
        <section class="card" data-testid="step-acceptance-criteria" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:0.5rem;">
            C — Acceptance criteria
          </h2>
          <p style="color:var(--text-secondary);margin-bottom:1rem;">
            Specify the acceptance criteria for the influencer's content.
          </p>
          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            @for (c of acceptanceCriteria(); track $index) {
              <div style="display:flex;gap:0.5rem;align-items:center;">
                <input
                  type="text"
                  class="input"
                  [attr.data-testid]="'criterion-' + $index"
                  [value]="c"
                  (input)="updateCriterion($index, $any($event.target).value)"
                  style="flex:1;"
                  aria-label="Acceptance criterion"
                />
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  [attr.data-testid]="'criterion-remove-' + $index"
                  (click)="removeCriterion($index)"
                  aria-label="Remove criterion"
                >
                  🗑
                </button>
              </div>
            }
          </div>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            data-testid="criterion-add"
            (click)="addCriterion()"
            style="margin-top:0.75rem;"
          >
            + Add criterion
          </button>
        </section>
      }

      <!-- STEP D — Deliverables -->
      @if (currentStep() === 'DELIVERABLES') {
        <section class="card" data-testid="step-deliverables" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:0.5rem;">
            D — Deliverables
          </h2>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            data-testid="deliverable-add"
            (click)="addDeliverable()"
            style="margin-bottom:1rem;"
          >
            + Add a product delivery
          </button>

          @for (d of deliverables(); track d.id; let i = $index) {
            <div
              class="card"
              [attr.data-testid]="'deliverable-' + i"
              style="margin-bottom:1rem;padding:1rem;"
            >
              <div
                style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;"
              >
                <strong>Delivery #{{ i + 1 }}</strong>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  [attr.data-testid]="'deliverable-remove-' + i"
                  (click)="removeDeliverable(i)"
                  aria-label="Remove delivery"
                >
                  🗑
                </button>
              </div>
              <div
                style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.75rem;"
              >
                <div>
                  <label class="label label-required" [attr.for]="'deliverable-platform-' + i"
                    >Your platform</label
                  >
                  <select
                    class="select"
                    required
                    [attr.id]="'deliverable-platform-' + i"
                    [attr.data-testid]="'deliverable-platform-' + i"
                    [ngModel]="d.platform"
                    (ngModelChange)="updateDeliverable(i, 'platform', $event)"
                    [name]="'platform-' + i"
                  >
                    <option value="">Select…</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="TIKTOK">TikTok</option>
                  </select>
                </div>
                <div>
                  <label class="label label-required" [attr.for]="'deliverable-contentType-' + i"
                    >Content type</label
                  >
                  <select
                    class="select"
                    required
                    [attr.id]="'deliverable-contentType-' + i"
                    [attr.data-testid]="'deliverable-contentType-' + i"
                    [ngModel]="d.contentType"
                    (ngModelChange)="updateDeliverable(i, 'contentType', $event)"
                    [name]="'contentType-' + i"
                    [disabled]="!d.platform"
                  >
                    <option value="">Select…</option>
                    @for (ct of contentTypesFor(d.platform); track ct) {
                      <option [value]="ct">{{ contentTypeLabel(ct) }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="label label-required" [attr.for]="'deliverable-quantity-' + i"
                    >Quantity</label
                  >
                  <input
                    type="number"
                    min="1"
                    class="input"
                    required
                    [attr.id]="'deliverable-quantity-' + i"
                    [attr.data-testid]="'deliverable-quantity-' + i"
                    [ngModel]="d.quantity"
                    (ngModelChange)="updateDeliverable(i, 'quantity', $event)"
                    [name]="'quantity-' + i"
                  />
                </div>
                <div>
                  <label class="label label-required" [attr.for]="'deliverable-unitPrice-' + i"
                    >Unit price</label
                  >
                  <div class="input-mad">
                    <input
                      type="number"
                      min="0"
                      required
                      [attr.id]="'deliverable-unitPrice-' + i"
                      [attr.data-testid]="'deliverable-unitPrice-' + i"
                      [ngModel]="d.unitPrice"
                      (ngModelChange)="updateDeliverable(i, 'unitPrice', $event)"
                      [name]="'unitPrice-' + i"
                    />
                    <span class="input-mad-suffix">Dhs</span>
                  </div>
                </div>
                <div>
                  <label class="label label-required" [attr.for]="'deliverable-taggedAccount-' + i"
                    >Tagged account</label
                  >
                  <div class="input-tagged">
                    <span class="input-tagged-prefix">&#64;</span>
                    <input
                      type="text"
                      required
                      [attr.id]="'deliverable-taggedAccount-' + i"
                      [attr.data-testid]="'deliverable-taggedAccount-' + i"
                      [ngModel]="taggedHandle(d.taggedAccount)"
                      (ngModelChange)="updateDeliverable(i, 'taggedAccount', '@' + $event)"
                      [name]="'taggedAccount-' + i"
                    />
                  </div>
                </div>
              </div>
            </div>
          }

          @if (deliverables().length === 0) {
            <p
              class="help-text"
              style="color:var(--text-muted);"
              data-testid="deliverables-empty-hint"
            >
              Add at least one delivery to continue.
            </p>
          } @else if (!allDeliverablesValid()) {
            <p
              id="dates-disabled"
              class="help-text"
              style="text-align:end;"
              data-testid="dates-disabled-hint"
            >
              Complete deliverable to enable.
            </p>
          }
        </section>
      }

      <!-- STEP E — Dates -->
      @if (currentStep() === 'DATES') {
        <section class="card" data-testid="step-dates" style="margin-bottom:1.5rem;">
          <h2 style="font-weight:600;font-size:var(--text-h3);margin-bottom:1rem;">
            E — Dates
          </h2>
          @for (d of deliverables(); track d.id; let i = $index) {
            <div
              class="card"
              [attr.data-testid]="'dates-row-' + i"
              style="margin-bottom:1rem;padding:1rem;"
            >
              <strong style="display:block;margin-bottom:0.5rem;">
                Delivery #{{ i + 1 }} — {{ platformLabel(d.platform) }}
                {{ contentTypeLabel(d.contentType) }}
              </strong>
              <div
                style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.75rem;"
              >
                <div>
                  <label class="label label-required" [attr.for]="'dates-reception-' + i"
                    >Date of reception</label
                  >
                  <input
                    type="date"
                    class="input"
                    required
                    [attr.id]="'dates-reception-' + i"
                    [attr.data-testid]="'dates-reception-' + i"
                    [ngModel]="d.dateReception"
                    (ngModelChange)="updateDeliverable(i, 'dateReception', $event)"
                    [name]="'dateReception-' + i"
                  />
                </div>
                <div>
                  <label class="label label-required" [attr.for]="'dates-publication-' + i"
                    >Date of publication</label
                  >
                  <input
                    type="date"
                    class="input"
                    required
                    [attr.id]="'dates-publication-' + i"
                    [attr.data-testid]="'dates-publication-' + i"
                    [ngModel]="d.datePublication"
                    (ngModelChange)="updateDeliverable(i, 'datePublication', $event)"
                    [name]="'datePublication-' + i"
                  />
                </div>
              </div>
            </div>
          }
        </section>
      }

      <!-- Actions -->
      <div
        style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;"
      >
        <button
          type="button"
          class="btn btn-ghost"
          data-testid="btn-previous"
          [disabled]="currentStep() === 'BRAND_INFO' || saving()"
          (click)="goPrevious()"
        >
          ← Previous
        </button>
        <div style="display:flex;gap:0.5rem;">
          @if (currentStep() === 'BRAND_INFO') {
            <button
              type="button"
              class="btn btn-primary"
              data-testid="btn-next"
              [disabled]="!canAdvance() || saving()"
              (click)="goNext()"
            >
              Next: Describe product →
            </button>
          } @else if (currentStep() === 'PRODUCT_DETAILS') {
            <button
              type="button"
              class="btn btn-primary"
              data-testid="btn-next"
              [disabled]="!canAdvance() || saving()"
              (click)="goNext()"
            >
              Next →
            </button>
          } @else if (currentStep() === 'ACCEPTANCE_CRITERIA') {
            <button
              type="button"
              class="btn btn-primary"
              data-testid="btn-next"
              [disabled]="!canAdvance() || saving()"
              (click)="goNext()"
            >
              Specify deliverables →
            </button>
          } @else if (currentStep() === 'DELIVERABLES') {
            <button
              type="button"
              class="btn btn-primary"
              data-testid="btn-next"
              [disabled]="!canAdvance() || saving()"
              aria-describedby="dates-disabled"
              (click)="goNext()"
            >
              Specify dates →
            </button>
          } @else if (currentStep() === 'DATES') {
            <button
              type="button"
              class="btn btn-primary"
              data-testid="btn-publish"
              [disabled]="!canAdvance() || saving()"
              (click)="onPublish()"
            >
              Publish
            </button>
          }
        </div>
      </div>
    </main>
  `,
})
export class BusinessMarketplaceCreatePage implements OnInit {
  private readonly api = inject(BusinessApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly steps = STEPS;

  protected readonly productId = signal<string | null>(null);
  protected readonly currentStep = signal<Step>('BRAND_INFO');
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly brands = signal<readonly SchemaBrandSummaryDto[]>([]);

  // Step A
  protected readonly brandId = signal<string>('');
  protected readonly brandDescription = signal<string>('');

  // Step B
  protected readonly productName = signal<string>('');
  protected readonly productDescription = signal<string>('');
  protected readonly requestedContent = signal<string>('');
  protected readonly miniScript = signal<string>('');

  // Step C
  protected readonly acceptanceCriteria = signal<readonly string[]>([]);

  // Step D + E
  protected readonly deliverables = signal<readonly DeliverableForm[]>([]);

  protected readonly canAdvance = computed(() => {
    switch (this.currentStep()) {
      case 'BRAND_INFO':
        return this.brandId().length > 0 && this.brandDescription().trim().length > 0;
      case 'PRODUCT_DETAILS':
        return (
          this.productName().trim().length > 0 &&
          this.productDescription().trim().length > 0 &&
          this.requestedContent().trim().length > 0 &&
          this.miniScript().trim().length > 0
        );
      case 'ACCEPTANCE_CRITERIA':
        return this.acceptanceCriteria().some((c) => c.trim().length > 0);
      case 'DELIVERABLES':
        return this.deliverables().length > 0 && this.allDeliverablesValid();
      case 'DATES':
        return this.deliverables().every(
          (d) =>
            d.dateReception !== '' &&
            d.datePublication !== '' &&
            d.datePublication >= d.dateReception,
        );
    }
  });

  protected readonly allDeliverablesValid = computed(() =>
    this.deliverables().every((d) => this.isDeliverableValid(d)),
  );

  ngOnInit(): void {
    this.loadBrands();
    const editId = this.route.snapshot.queryParamMap.get('id');
    if (editId) {
      this.productId.set(editId);
      this.loadDraft(editId);
    }
  }

  protected isCompleted(stepId: Step): boolean {
    const order = STEPS.map((s) => s.id);
    return order.indexOf(stepId) < order.indexOf(this.currentStep());
  }

  protected addCriterion(): void {
    this.acceptanceCriteria.update((arr) => [...arr, '']);
  }

  protected updateCriterion(idx: number, value: string): void {
    this.acceptanceCriteria.update((arr) => arr.map((c, i) => (i === idx ? value : c)));
  }

  protected removeCriterion(idx: number): void {
    this.acceptanceCriteria.update((arr) => arr.filter((_, i) => i !== idx));
  }

  protected addDeliverable(): void {
    this.deliverables.update((arr) => [...arr, emptyDeliverable()]);
  }

  protected removeDeliverable(idx: number): void {
    this.deliverables.update((arr) => arr.filter((_, i) => i !== idx));
  }

  protected updateDeliverable<K extends keyof DeliverableForm>(
    idx: number,
    field: K,
    value: DeliverableForm[K],
  ): void {
    this.deliverables.update((arr) =>
      arr.map((d, i) => {
        if (i !== idx) return d;
        const next = { ...d, [field]: value };
        // If platform changed, reset contentType to ensure compatibility
        if (field === 'platform') {
          next.contentType = '';
        }
        return next;
      }),
    );
  }

  protected contentTypesFor(platform: Platform | ''): readonly ContentType[] {
    if (!platform) return [];
    return CONTENT_TYPES_BY_PLATFORM[platform] ?? [];
  }

  protected contentTypeLabel(ct: ContentType | ''): string {
    if (!ct) return '';
    return ct.charAt(0).toUpperCase() + ct.slice(1);
  }

  protected platformLabel(p: Platform | ''): string {
    switch (p) {
      case 'INSTAGRAM':
        return 'Instagram';
      case 'YOUTUBE':
        return 'YouTube';
      case 'TIKTOK':
        return 'TikTok';
      case 'TWITTER':
        return 'Twitter';
      default:
        return '';
    }
  }

  protected taggedHandle(value: string): string {
    return value.startsWith('@') ? value.slice(1) : value;
  }

  // US-121 — deliverable validation rules
  private isDeliverableValid(d: DeliverableForm): boolean {
    if (!d.platform || !d.contentType) return false;
    if (!Number.isFinite(d.quantity) || d.quantity < 1) return false;
    if (!Number.isFinite(d.unitPrice) || d.unitPrice < 0) return false;
    if (!d.taggedAccount.startsWith('@') || d.taggedAccount.length < 2) return false;
    const allowed = CONTENT_TYPES_BY_PLATFORM[d.platform];
    if (!allowed.includes(d.contentType as ContentType)) return false;
    return true;
  }

  protected goPrevious(): void {
    const order = STEPS.map((s) => s.id);
    const idx = order.indexOf(this.currentStep());
    if (idx > 0) this.currentStep.set(order[idx - 1]);
  }

  protected goNext(): void {
    if (!this.canAdvance() || this.saving()) return;
    this.errorMessage.set(null);
    this.saving.set(true);

    const step = this.currentStep();
    const dto = this.buildStepDto(step);

    const handleAdvance = () => {
      const order = STEPS.map((s) => s.id);
      const idx = order.indexOf(step);
      if (idx < order.length - 1) this.currentStep.set(order[idx + 1]);
      this.saving.set(false);
    };

    const id = this.productId();
    if (step === 'BRAND_INFO' && !id) {
      this.api
        .createDraftProduct({
          brandId: this.brandId(),
          brandDescription: this.brandDescription(),
        })
        .subscribe({
          next: (draft) => {
            this.productId.set(draft.id);
            handleAdvance();
          },
          error: () => {
            this.saving.set(false);
            this.errorMessage.set('Could not save draft. Please try again.');
          },
        });
      return;
    }

    if (!id) {
      this.saving.set(false);
      return;
    }

    this.api.saveProductStep(id, dto).subscribe({
      next: () => handleAdvance(),
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Could not save this step. Please try again.');
      },
    });
  }

  protected onPublish(): void {
    const id = this.productId();
    if (!id || !this.canAdvance() || this.saving()) return;
    this.saving.set(true);
    this.api.saveProductStep(id, this.buildStepDto('DATES')).subscribe({
      next: () => {
        this.api.publishProduct(id).subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/business/marketplace']);
          },
          error: () => {
            this.saving.set(false);
            this.errorMessage.set('Could not publish product. Please try again.');
          },
        });
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Could not save dates. Please try again.');
      },
    });
  }

  private buildStepDto(step: Step): SchemaUpdateMarketplaceProductDto {
    switch (step) {
      case 'BRAND_INFO':
        return {
          step,
          brandId: this.brandId(),
          brandDescription: this.brandDescription(),
        };
      case 'PRODUCT_DETAILS':
        return {
          step,
          productName: this.productName(),
          productDescription: this.productDescription(),
          requestedContent: this.requestedContent(),
          miniScript: this.miniScript(),
        };
      case 'ACCEPTANCE_CRITERIA':
        return {
          step,
          acceptanceCriteria: this.acceptanceCriteria().filter((c) => c.trim().length > 0),
        };
      case 'DELIVERABLES':
        return {
          step,
          deliverables: this.deliverables().map((d) => ({
            contentType: d.contentType as ContentType,
            platform: d.platform as Platform,
            quantity: Number(d.quantity),
            unitPrice: Number(d.unitPrice),
            taggedAccount: d.taggedAccount,
            dateReception: d.dateReception || '1970-01-01',
            datePublication: d.datePublication || '1970-01-01',
          })),
        };
      case 'DATES':
        return {
          step,
          deliverables: this.deliverables().map((d) => ({
            contentType: d.contentType as ContentType,
            platform: d.platform as Platform,
            quantity: Number(d.quantity),
            unitPrice: Number(d.unitPrice),
            taggedAccount: d.taggedAccount,
            dateReception: d.dateReception,
            datePublication: d.datePublication,
          })),
        };
    }
  }

  private loadBrands(): void {
    this.api.listBrands().subscribe({
      next: (list) => this.brands.set(list),
      error: () => this.brands.set([]),
    });
  }

  private loadDraft(id: string): void {
    this.api.getDraftProduct(id).subscribe({
      next: (draft) => this.hydrate(draft),
      error: () => this.errorMessage.set('Could not load draft.'),
    });
  }

  private hydrate(draft: SchemaMarketplaceProductWizardDto): void {
    this.brandId.set(draft.brandId);
    this.brandDescription.set(draft.brandDescription ?? '');
    this.productName.set(draft.productName ?? '');
    this.productDescription.set(draft.productDescription ?? '');
    this.requestedContent.set(draft.requestedContent ?? '');
    this.miniScript.set(draft.miniScript ?? '');
    this.acceptanceCriteria.set(draft.acceptanceCriteria ?? []);
    this.deliverables.set(
      (draft.deliverables ?? []).map((d) => ({
        id: d.id ?? `local-${Math.random().toString(36).slice(2, 10)}`,
        platform: d.platform,
        contentType: d.contentType,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        taggedAccount: d.taggedAccount,
        dateReception: d.dateReception ?? '',
        datePublication: d.datePublication ?? '',
      })),
    );
    this.currentStep.set(draft.currentStep);
  }
}
