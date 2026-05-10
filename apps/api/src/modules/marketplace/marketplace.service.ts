import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';
import { BrandRepository } from '../brand/brand.repository';
import { CreatorEligibilityService } from '../creator-profile/creator-eligibility.service';

import {
  ApplicationDto,
  ListMarketplaceProductsQueryDto,
  MarketplaceProductCardDto,
  MarketplaceProductDetailDto,
  PaginatedMarketplaceProductsDto,
} from './dto';
import {
  ApplicationRecord,
  MarketplaceProductRecord,
  MarketplaceRepository,
} from './marketplace.repository';

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
}
