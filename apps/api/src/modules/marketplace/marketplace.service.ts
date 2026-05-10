import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';
import { BrandRepository } from '../brand/brand.repository';
import { CreatorEligibilityService } from '../creator-profile/creator-eligibility.service';

import {
  ApplicationDto,
  CreateMarketplaceProductDto,
  DeliverableInputDto,
  ListCollaborationsQueryDto,
  ListMarketplaceProductsQueryDto,
  ListMyMarketplaceProductsQueryDto,
  MARKETPLACE_WIZARD_STEPS,
  MarketplaceProductCardDto,
  MarketplaceProductDetailDto,
  MarketplaceProductWizardDto,
  MarketplaceWizardStep,
  PaginatedCollaborationsDto,
  PaginatedMarketplaceProductsDto,
  UpdateMarketplaceProductDto,
} from './dto';
import {
  ApplicationRecord,
  MarketplaceDeliverableRecord,
  MarketplaceProductRecord,
  MarketplaceRepository,
} from './marketplace.repository';

import type { SocialPlatform } from '@my-app/shared-types';

const PUBLISH_TTL_MS = 30 * 24 * 3600 * 1000;

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly repo: MarketplaceRepository,
    private readonly brandRepo: BrandRepository,
    private readonly eligibility: CreatorEligibilityService,
  ) {}

  /**
   * US-030 — Browse published marketplace products. Expired products keep
   * being returned so the UI can show the "Expired" badge (US-035).
   */
  async listProducts(
    query: ListMarketplaceProductsQueryDto,
  ): Promise<PaginatedMarketplaceProductsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { items, total } = await this.repo.listPublishedProducts({
      q: query.q,
      page,
      limit,
    });

    const brandCache = new Map<string, MarketplaceProductCardDto['brand']>();
    const cards: MarketplaceProductCardDto[] = [];
    for (const p of items) {
      cards.push(await this.toCard(p, brandCache));
    }
    return { items: cards, page, limit, total };
  }

  /**
   * US-031 — Full product detail. We still return the resource when expired
   * (US-035) and let the UI flag `isExpired`. 404 only if the product does
   * not exist or is not publicly visible (DRAFT, DELETED, CLOSED).
   */
  async getProduct(productId: string): Promise<MarketplaceProductDetailDto> {
    const product = await this.requirePublishedProduct(productId);
    const [deliverables, brand] = await Promise.all([
      this.repo.listDeliverables(productId),
      this.brandRepo.getBrand(product.brandId),
    ]);

    const totalCompensationDhs = deliverables.reduce(
      (acc, d) => acc + d.unitPriceMad * d.quantity,
      0,
    );

    return {
      id: product.id,
      brand: {
        id: product.brandId,
        name: brand?.name ?? '',
        avatarUrl: brand?.logoUrl,
        description: brand?.industry
          ? `${brand.industry}${brand.country ? ` — ${brand.country}` : ''}`
          : undefined,
      },
      productName: product.productName,
      productDescription: product.productDescription,
      requestedContent: product.requestedContent,
      miniScript: product.miniScript,
      deliverables: deliverables.map((d) => ({
        platform: d.platform,
        contentType: d.contentType,
        quantity: d.quantity,
        unitPrice: d.unitPriceMad,
        taggedAccount: d.taggedAccount,
        dateReception: d.receptionDate,
        datePublication: d.publicationDate,
      })),
      hashtags: product.hashtags ?? [],
      callToAction: product.callToAction,
      slotsLeft: product.slotsLeft,
      expiresAt: product.expiresAt,
      isExpired: this.isExpired(product),
      totalCompensationDhs,
      currency: 'MAD',
      paidByInflu: true,
      segmentTier: product.segmentTier,
      platform: product.platform,
    };
  }

  /**
   * US-032 / US-033 — Apply to a marketplace product as a creator.
   * Order of checks (each maps to a distinct AC):
   *   1. Product exists & is browseable      → 404 PRODUCT_NOT_FOUND
   *   2. Product is expired                  → 410 PRODUCT_EXPIRED
   *   3. Eligibility (CIN+RIB+ICE)           → 409 PROFILE_INCOMPLETE + missing[]
   *   4. Already applied                     → 409 ALREADY_APPLIED
   *   5. Slots full                          → 409 NO_SLOTS_LEFT
   *   6. Atomic transact (idempotent fallback for 4 & 5)
   */
  async applyToProduct(
    creatorId: string,
    productId: string,
  ): Promise<ApplicationDto> {
    const product = await this.requirePublishedProduct(productId);

    if (this.isExpired(product)) {
      throw new BusinessException(
        ERROR_CODES.PRODUCT_EXPIRED,
        'This marketplace opportunity has expired',
        HttpStatus.GONE,
      );
    }

    const eligibility = await this.eligibility.checkApplyEligibility(creatorId);
    if (!eligibility.canApply) {
      throw new BusinessException(
        ERROR_CODES.PROFILE_INCOMPLETE,
        'Complete your profile (CIN validated, RIB uploaded, ICE filled) to apply',
        HttpStatus.CONFLICT,
        { missing: eligibility.missing },
      );
    }

    const existing = await this.repo.getApplication(creatorId, productId);
    if (existing) {
      throw new BusinessException(
        ERROR_CODES.ALREADY_APPLIED,
        'You have already applied to this opportunity',
        HttpStatus.CONFLICT,
      );
    }

    if (product.slotsLeft <= 0) {
      throw new BusinessException(
        ERROR_CODES.NO_SLOTS_LEFT,
        'No slots left on this opportunity',
        HttpStatus.CONFLICT,
      );
    }

    const now = new Date().toISOString();
    const record: ApplicationRecord = {
      applicationId: randomUUID(),
      productId,
      creatorId,
      brandId: product.brandId,
      ownerUserId: product.ownerUserId,
      status: 'APPLIED',
      appliedAt: now,
      tier: product.segmentTier,
    };

    try {
      await this.repo.applyTransact(record, now);
    } catch (err) {
      const e = err as { name?: string; CancellationReasons?: { Code?: string }[] };
      if (e.name === 'TransactionCanceledException') {
        const reasons = e.CancellationReasons ?? [];
        const updateReason = reasons[0]?.Code;
        const putReason = reasons[1]?.Code;
        if (putReason === 'ConditionalCheckFailed') {
          throw new BusinessException(
            ERROR_CODES.ALREADY_APPLIED,
            'You have already applied to this opportunity',
            HttpStatus.CONFLICT,
          );
        }
        if (updateReason === 'ConditionalCheckFailed') {
          // Re-read to disambiguate slots vs. expiry race.
          const fresh = await this.repo.getProduct(productId);
          if (fresh && this.isExpired(fresh)) {
            throw new BusinessException(
              ERROR_CODES.PRODUCT_EXPIRED,
              'This marketplace opportunity has expired',
              HttpStatus.GONE,
            );
          }
          throw new BusinessException(
            ERROR_CODES.NO_SLOTS_LEFT,
            'No slots left on this opportunity',
            HttpStatus.CONFLICT,
          );
        }
      }
      throw err;
    }

    return {
      id: record.applicationId,
      productId,
      creatorId,
      status: 'APPLIED',
      appliedAt: now,
    };
  }

  // ------------- helpers -------------

  private async requirePublishedProduct(
    productId: string,
  ): Promise<MarketplaceProductRecord> {
    const product = await this.repo.getProduct(productId);
    if (!product || product.status !== 'PUBLISHED') {
      throw new BusinessException(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        `Marketplace product ${productId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return product;
  }

  private isExpired(product: MarketplaceProductRecord): boolean {
    return new Date(product.expiresAt).getTime() < Date.now();
  }

  private async toCard(
    p: MarketplaceProductRecord,
    brandCache: Map<string, MarketplaceProductCardDto['brand']>,
  ): Promise<MarketplaceProductCardDto> {
    let brand = brandCache.get(p.brandId);
    if (!brand) {
      const b = await this.brandRepo.getBrand(p.brandId);
      brand = {
        id: p.brandId,
        name: b?.name ?? '',
        avatarUrl: b?.logoUrl,
      };
      brandCache.set(p.brandId, brand);
    }
    return {
      id: p.id,
      brand,
      productName: p.productName,
      segmentTier: p.segmentTier,
      slotsLeft: p.slotsLeft,
      compensationDhs: p.totalAmountMad,
      currency: 'MAD',
      platform: p.platform,
      expiresAt: p.expiresAt,
      isExpired: this.isExpired(p),
    };
  }

  // =====================================================================
  // US-120 — Marketplace product creation wizard (5 steps)
  // =====================================================================

  /**
   * US-120, step 1 (BRAND_INFO) — create a DRAFT product. Returns
   * `{id, currentStep:'BRAND_INFO', ...}`.
   */
  async createDraftProduct(
    ownerUserId: string,
    dto: CreateMarketplaceProductDto,
  ): Promise<MarketplaceProductWizardDto> {
    const brand = await this.brandRepo.getBrand(dto.brandId);
    if (!brand) {
      throw new BusinessException(
        ERROR_CODES.BRAND_NOT_FOUND,
        `Brand ${dto.brandId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    const now = new Date().toISOString();
    const id = randomUUID();
    const product: MarketplaceProductRecord = {
      id,
      ownerUserId,
      brandId: dto.brandId,
      brandDescription: dto.brandDescription,
      productName: '',
      productDescription: '',
      requestedContent: '',
      miniScript: '',
      acceptanceCriteria: [],
      hashtags: [],
      callToAction: '',
      platform: 'INSTAGRAM',
      segmentTier: 'MICRO',
      slotsTotal: 0,
      slotsLeft: 0,
      totalAmountMad: 0,
      currency: 'MAD',
      paidByInflu: true,
      status: 'DRAFT',
      currentStep: 'BRAND_INFO',
      publishedAt: now,
      expiresAt: new Date(Date.now() + PUBLISH_TTL_MS).toISOString(),
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.putProduct(product);
    return this.toWizardDto(product, []);
  }

  /**
   * US-120/US-121 — Save one wizard step. Validates that the previous step
   * is complete (else `422 WIZARD_INCOMPLETE`) and that the current payload
   * passes step-specific business rules (notably `121` for deliverables).
   */
  async updateWizardStep(
    ownerUserId: string,
    productId: string,
    dto: UpdateMarketplaceProductDto,
  ): Promise<MarketplaceProductWizardDto> {
    const product = await this.requireOwnedDraft(ownerUserId, productId);

    const step = dto.step;
    const requiredPrevious = MARKETPLACE_WIZARD_STEPS.indexOf(step) - 1;
    if (requiredPrevious >= 0) {
      const prev = MARKETPLACE_WIZARD_STEPS[requiredPrevious];
      if (!this.isStepComplete(product, prev)) {
        throw new BusinessException(
          ERROR_CODES.WIZARD_INCOMPLETE,
          `Step ${step} requires step ${prev} to be completed first`,
          HttpStatus.UNPROCESSABLE_ENTITY,
          { missingStep: prev },
        );
      }
    }

    const patch: Partial<MarketplaceProductRecord> = {};
    let deliverablesToSave: MarketplaceDeliverableRecord[] | null = null;

    if (step === 'BRAND_INFO') {
      if (!dto.brandId || !dto.brandDescription) {
        throw this.wizardIncomplete(step, 'brandId/brandDescription');
      }
      const brand = await this.brandRepo.getBrand(dto.brandId);
      if (!brand) {
        throw new BusinessException(
          ERROR_CODES.BRAND_NOT_FOUND,
          `Brand ${dto.brandId} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      patch.brandId = dto.brandId;
      patch.brandDescription = dto.brandDescription;
    } else if (step === 'PRODUCT_DETAILS') {
      if (
        !dto.productName ||
        !dto.productDescription ||
        !dto.requestedContent ||
        !dto.miniScript
      ) {
        throw this.wizardIncomplete(
          step,
          'productName/productDescription/requestedContent/miniScript',
        );
      }
      patch.productName = dto.productName;
      patch.productDescription = dto.productDescription;
      patch.requestedContent = dto.requestedContent;
      patch.miniScript = dto.miniScript;
    } else if (step === 'ACCEPTANCE_CRITERIA') {
      if (!dto.acceptanceCriteria || dto.acceptanceCriteria.length === 0) {
        throw this.wizardIncomplete(step, 'acceptanceCriteria');
      }
      patch.acceptanceCriteria = dto.acceptanceCriteria;
    } else if (step === 'DELIVERABLES') {
      if (!dto.deliverables || dto.deliverables.length === 0) {
        throw this.wizardIncomplete(step, 'deliverables');
      }
      this.validateDeliverables(dto.deliverables);
      deliverablesToSave = dto.deliverables.map((d) => ({
        productId,
        deliverableId: d.id ?? randomUUID(),
        platform: d.platform,
        contentType: d.contentType,
        quantity: d.quantity,
        unitPriceMad: d.unitPrice,
        taggedAccount: d.taggedAccount,
        receptionDate: d.dateReception,
        publicationDate: d.datePublication,
      }));
      const total = deliverablesToSave.reduce(
        (acc, d) => acc + d.unitPriceMad * d.quantity,
        0,
      );
      patch.totalAmountMad = total;
      patch.platform = deliverablesToSave[0].platform as SocialPlatform;
      patch.slotsTotal = deliverablesToSave.reduce(
        (acc, d) => acc + d.quantity,
        0,
      );
      patch.slotsLeft = patch.slotsTotal;
      patch.hashtags = dto.hashtags ?? [];
      patch.callToAction = dto.callToAction ?? '';
    } else if (step === 'DATES') {
      // DATES re-validates the deliverable dates that were saved at step
      // DELIVERABLES; if dto.deliverables is provided we replace, otherwise
      // we just confirm currentStep transition.
      if (dto.deliverables && dto.deliverables.length > 0) {
        this.validateDeliverables(dto.deliverables);
        deliverablesToSave = dto.deliverables.map((d) => ({
          productId,
          deliverableId: d.id ?? randomUUID(),
          platform: d.platform,
          contentType: d.contentType,
          quantity: d.quantity,
          unitPriceMad: d.unitPrice,
          taggedAccount: d.taggedAccount,
          receptionDate: d.dateReception,
          publicationDate: d.datePublication,
        }));
      } else {
        // Re-validate persisted deliverables.
        const existing = await this.repo.listDeliverables(productId);
        if (existing.length === 0) {
          throw this.wizardIncomplete(step, 'deliverables');
        }
        for (const d of existing) {
          if (Date.parse(d.publicationDate) < Date.parse(d.receptionDate)) {
            throw new BusinessException(
              ERROR_CODES.INVALID_DELIVERABLE,
              'datePublication must be on or after dateReception',
              HttpStatus.UNPROCESSABLE_ENTITY,
              { field: 'datePublication', deliverableId: d.deliverableId },
            );
          }
        }
      }
    }

    const now = new Date().toISOString();
    patch.currentStep = step;
    patch.updatedAt = now;

    const updated: MarketplaceProductRecord = { ...product, ...patch };
    await this.repo.putProduct(updated);
    if (deliverablesToSave) {
      await this.repo.replaceDeliverables(productId, deliverablesToSave);
    }
    const deliverables = await this.repo.listDeliverables(productId);
    return this.toWizardDto(updated, deliverables);
  }

  /**
   * US-120 — Publish a draft. Verifies that all 5 wizard steps were saved
   * (`422 WIZARD_INCOMPLETE`), then transitions status to `PUBLISHED` and
   * recomputes `expiresAt = now + 30d`, `slotsLeft = sum(quantity)`.
   */
  async publishProduct(
    ownerUserId: string,
    productId: string,
  ): Promise<MarketplaceProductWizardDto> {
    const product = await this.requireOwnedDraft(ownerUserId, productId);
    if (product.currentStep !== 'DATES') {
      throw new BusinessException(
        ERROR_CODES.WIZARD_INCOMPLETE,
        'All 5 wizard steps must be completed before publishing',
        HttpStatus.UNPROCESSABLE_ENTITY,
        { currentStep: product.currentStep ?? null },
      );
    }
    const deliverables = await this.repo.listDeliverables(productId);
    if (deliverables.length === 0) {
      throw new BusinessException(
        ERROR_CODES.WIZARD_INCOMPLETE,
        'Cannot publish without deliverables',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + PUBLISH_TTL_MS).toISOString();
    const slotsTotal = deliverables.reduce((acc, d) => acc + d.quantity, 0);
    const updated: MarketplaceProductRecord = {
      ...product,
      status: 'PUBLISHED',
      publishedAt: now,
      expiresAt,
      slotsTotal,
      slotsLeft: slotsTotal,
      updatedAt: now,
    };
    await this.repo.putProduct(updated);
    return this.toWizardDto(updated, deliverables);
  }

  /**
   * US-120 — Soft delete (status=DELETED). The owner check enforces
   * multi-tenant isolation (403 if not the owner).
   */
  async deleteProduct(ownerUserId: string, productId: string): Promise<void> {
    const product = await this.repo.getProduct(productId);
    if (!product || product.status === 'DELETED') {
      throw new BusinessException(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        `Marketplace product ${productId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (product.ownerUserId !== ownerUserId) {
      throw new BusinessException(
        ERROR_CODES.FORBIDDEN,
        'You do not own this marketplace product',
        HttpStatus.FORBIDDEN,
      );
    }
    await this.repo.softDeleteProduct(productId, new Date().toISOString());
  }

  /**
   * US-120 — Get one of my products (any status except DELETED).
   */
  async getOwnedProduct(
    ownerUserId: string,
    productId: string,
  ): Promise<MarketplaceProductWizardDto> {
    const product = await this.repo.getProduct(productId);
    if (!product || product.status === 'DELETED') {
      throw new BusinessException(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        `Marketplace product ${productId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (product.ownerUserId !== ownerUserId) {
      throw new BusinessException(
        ERROR_CODES.FORBIDDEN,
        'You do not own this marketplace product',
        HttpStatus.FORBIDDEN,
      );
    }
    const deliverables = await this.repo.listDeliverables(productId);
    return this.toWizardDto(product, deliverables);
  }

  // =====================================================================
  // US-122 — My Marketplace
  // =====================================================================

  async listMyProducts(
    ownerUserId: string,
    query: ListMyMarketplaceProductsQueryDto,
  ): Promise<PaginatedMarketplaceProductsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { items, total } = await this.repo.listProductsByOwner({
      ownerUserId,
      brandId: query.brand,
      status: query.status,
      page,
      limit,
    });
    const brandCache = new Map<string, MarketplaceProductCardDto['brand']>();
    const cards: MarketplaceProductCardDto[] = [];
    for (const p of items) {
      cards.push(await this.toCard(p, brandCache));
    }
    return { items: cards, page, limit, total };
  }

  // ------------- private helpers (wizard) -------------

  private async requireOwnedDraft(
    ownerUserId: string,
    productId: string,
  ): Promise<MarketplaceProductRecord> {
    const product = await this.repo.getProduct(productId);
    if (!product || product.status === 'DELETED') {
      throw new BusinessException(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        `Marketplace product ${productId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (product.ownerUserId !== ownerUserId) {
      throw new BusinessException(
        ERROR_CODES.FORBIDDEN,
        'You do not own this marketplace product',
        HttpStatus.FORBIDDEN,
      );
    }
    return product;
  }

  private isStepComplete(
    p: MarketplaceProductRecord,
    step: MarketplaceWizardStep,
  ): boolean {
    if (!p.currentStep) return false;
    return (
      MARKETPLACE_WIZARD_STEPS.indexOf(p.currentStep) >=
      MARKETPLACE_WIZARD_STEPS.indexOf(step)
    );
  }

  private wizardIncomplete(
    step: MarketplaceWizardStep,
    field: string,
  ): BusinessException {
    return new BusinessException(
      ERROR_CODES.WIZARD_INCOMPLETE,
      `Step ${step} is missing required field(s): ${field}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
      { step, field },
    );
  }

  /**
   * US-121 — Server-side validation of deliverables (in addition to
   * class-validator). Throws `422 INVALID_DELIVERABLE` with `details.field`.
   */
  private validateDeliverables(deliverables: DeliverableInputDto[]): void {
    const allowedByPlatform: Record<SocialPlatform, string[]> = {
      INSTAGRAM: ['post', 'carousel', 'story', 'reel', 'live'],
      YOUTUBE: ['video', 'short', 'live'],
      TIKTOK: ['video', 'short', 'live'],
      TWITTER: ['post'],
    };
    for (const d of deliverables) {
      if (!d.taggedAccount || !d.taggedAccount.startsWith('@')) {
        throw new BusinessException(
          ERROR_CODES.INVALID_DELIVERABLE,
          'taggedAccount must start with @',
          HttpStatus.UNPROCESSABLE_ENTITY,
          { field: 'taggedAccount' },
        );
      }
      if (d.quantity < 1) {
        throw new BusinessException(
          ERROR_CODES.INVALID_DELIVERABLE,
          'quantity must be ≥ 1',
          HttpStatus.UNPROCESSABLE_ENTITY,
          { field: 'quantity' },
        );
      }
      if (d.unitPrice < 1) {
        throw new BusinessException(
          ERROR_CODES.INVALID_DELIVERABLE,
          'unitPrice must be ≥ 1',
          HttpStatus.UNPROCESSABLE_ENTITY,
          { field: 'unitPrice' },
        );
      }
      const allowed = allowedByPlatform[d.platform] ?? [];
      if (!allowed.includes(d.contentType)) {
        throw new BusinessException(
          ERROR_CODES.INVALID_DELIVERABLE,
          `contentType ${d.contentType} is not allowed for ${d.platform}`,
          HttpStatus.UNPROCESSABLE_ENTITY,
          { field: 'contentType', platform: d.platform },
        );
      }
      if (Date.parse(d.datePublication) < Date.parse(d.dateReception)) {
        throw new BusinessException(
          ERROR_CODES.INVALID_DELIVERABLE,
          'datePublication must be on or after dateReception',
          HttpStatus.UNPROCESSABLE_ENTITY,
          { field: 'datePublication' },
        );
      }
    }
  }

  private toWizardDto(
    p: MarketplaceProductRecord,
    deliverables: MarketplaceDeliverableRecord[],
  ): MarketplaceProductWizardDto {
    return {
      id: p.id,
      currentStep: p.currentStep ?? 'BRAND_INFO',
      status: p.status,
      brandId: p.brandId,
      brandDescription: p.brandDescription,
      productName: p.productName || undefined,
      productDescription: p.productDescription || undefined,
      requestedContent: p.requestedContent || undefined,
      miniScript: p.miniScript || undefined,
      acceptanceCriteria: p.acceptanceCriteria,
      deliverables: deliverables.map((d) => ({
        id: d.deliverableId,
        platform: d.platform,
        contentType: d.contentType as DeliverableInputDto['contentType'],
        quantity: d.quantity,
        unitPrice: d.unitPriceMad,
        taggedAccount: d.taggedAccount,
        dateReception: d.receptionDate,
        datePublication: d.publicationDate,
      })),
      hashtags: p.hashtags,
      callToAction: p.callToAction || undefined,
      publishedAt:
        p.status === 'PUBLISHED' || p.status === 'EXPIRED'
          ? p.publishedAt
          : undefined,
      expiresAt:
        p.status === 'PUBLISHED' || p.status === 'EXPIRED'
          ? p.expiresAt
          : undefined,
      slotsLeft:
        p.status === 'PUBLISHED' || p.status === 'EXPIRED'
          ? p.slotsLeft
          : undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  // =====================================================================
  // US-040 — Creator collaborations
  // =====================================================================

  /**
   * US-040 — List my (creator) collaborations. One row per `Application`
   * submitted by the creator, joined with the marketplace product (campaign)
   * and brand summary. Filters: `q` (campaign name contains, case-insensitive),
   * `brand` (brand id), `status` (application status). Sorted by `appliedAt` DESC.
   */
  async listMyCollaborations(
    creatorId: string,
    query: ListCollaborationsQueryDto,
  ): Promise<PaginatedCollaborationsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const applications = await this.repo.listApplicationsByCreator(creatorId);

    // Hydrate product + brand for each application.
    const productCache = new Map<string, MarketplaceProductRecord | null>();
    const brandCache = new Map<
      string,
      { id: string; name: string; avatarUrl?: string }
    >();
    type Hydrated = {
      app: ApplicationRecord;
      product: MarketplaceProductRecord | null;
      brand: { id: string; name: string; avatarUrl?: string };
    };
    const hydrated: Hydrated[] = [];
    for (const app of applications) {
      let product = productCache.get(app.productId);
      if (product === undefined) {
        product = await this.repo.getProduct(app.productId);
        productCache.set(app.productId, product);
      }
      let brand = brandCache.get(app.brandId);
      if (!brand) {
        const b = await this.brandRepo.getBrand(app.brandId);
        brand = {
          id: app.brandId,
          name: b?.name ?? '',
          avatarUrl: b?.logoUrl,
        };
        brandCache.set(app.brandId, brand);
      }
      hydrated.push({ app, product, brand });
    }

    // Apply filters in-memory (MVP scale).
    let filtered = hydrated;
    if (query.q && query.q.trim().length > 0) {
      const needle = query.q.toLowerCase();
      filtered = filtered.filter((h) =>
        (h.product?.productName ?? '').toLowerCase().includes(needle),
      );
    }
    if (query.brand) {
      filtered = filtered.filter((h) => h.app.brandId === query.brand);
    }
    if (query.status) {
      filtered = filtered.filter((h) => h.app.status === query.status);
    }

    // Sort by appliedAt DESC for stable creator timeline.
    filtered.sort((a, b) =>
      a.app.appliedAt < b.app.appliedAt ? 1 : -1,
    );

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((h) => ({
      id: h.app.applicationId,
      brand: {
        id: h.brand.id,
        name: h.brand.name,
        avatarUrl: h.brand.avatarUrl,
      },
      campaign: {
        id: h.app.productId,
        name: h.product?.productName ?? '',
      },
      status: h.app.status,
      // Snapshot of the campaign window. Uses product timestamps because the
      // collaboration window is the marketplace product publication period.
      startDate: h.product?.publishedAt ?? h.app.appliedAt,
      endDate: h.product?.expiresAt ?? h.app.appliedAt,
    }));

    return { items, page, limit, total };
  }
}
