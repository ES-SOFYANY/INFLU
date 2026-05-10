import { Injectable } from '@nestjs/common';

import { AuthRepository, type UserRecord } from '../auth/auth.repository';
import { BrandRepository } from '../brand/brand.repository';

import {
  ListBusinessPaymentsQueryDto,
  ListCreatorPaymentsQueryDto,
  PaginatedBusinessPaymentsDto,
  PaginatedCreatorPaymentsDto,
  PaymentBusinessRowDto,
  PaymentCreatorRowDto,
} from './dto';
import { PaymentRecord, PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly authRepo: AuthRepository,
    private readonly brandRepo: BrandRepository,
  ) {}

  /**
   * US-160 / US-161 — `GET /business/payments`. Multi-tenant: only payments
   * where `ownerUserId === currentUser.id`. Filtered by `type` (required),
   * `brand` (optional), `status` (optional). Sorted by `requestedAt DESC`.
   * Empty state returns `{items: [], total: 0}` (AC-161-02).
   */
  async listBusinessPayments(
    ownerUserId: string,
    query: ListBusinessPaymentsQueryDto,
  ): Promise<PaginatedBusinessPaymentsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const all = await this.repo.scanAll();
    const filtered = all
      .filter((p) => p.ownerUserId === ownerUserId)
      .filter((p) => p.type === query.type)
      .filter((p) => (query.brand ? p.brandId === query.brand : true))
      .filter((p) => (query.status ? p.status === query.status : true))
      .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));

    const start = (page - 1) * limit;
    const slice = filtered.slice(start, start + limit);
    const items = await Promise.all(slice.map((p) => this.toBusinessRow(p)));
    return { items, page, limit, total: filtered.length };
  }

  /**
   * US-160 — `GET /creator/me/payments`. Multi-tenant: only payments where
   * `creatorUserId === currentUser.id`. Filtered by `status` (optional).
   * Empty state returns `{items: [], total: 0}`.
   */
  async listCreatorPayments(
    creatorUserId: string,
    query: ListCreatorPaymentsQueryDto,
  ): Promise<PaginatedCreatorPaymentsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const all = await this.repo.scanAll();
    const filtered = all
      .filter((p) => p.creatorUserId === creatorUserId)
      .filter((p) => (query.status ? p.status === query.status : true))
      .sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));

    const start = (page - 1) * limit;
    const slice = filtered.slice(start, start + limit);
    const items = await Promise.all(slice.map((p) => this.toCreatorRow(p)));
    return { items, page, limit, total: filtered.length };
  }

  // ---------------- helpers ----------------

  private async toBusinessRow(p: PaymentRecord): Promise<PaymentBusinessRowDto> {
    const [creator, brand] = await Promise.all([
      this.authRepo.findById(p.creatorUserId),
      this.brandRepo.getBrand(p.brandId),
    ]);
    return {
      id: p.id,
      creator: this.creatorSummary(p.creatorUserId, creator),
      brand: { id: p.brandId, name: brand?.name ?? '' },
      status: p.status,
      amount: p.amount,
      currency: 'MAD',
      requestedAt: p.requestedAt,
      completedAt: p.completedAt,
    };
  }

  private async toCreatorRow(p: PaymentRecord): Promise<PaymentCreatorRowDto> {
    const brand = await this.brandRepo.getBrand(p.brandId);
    return {
      id: p.id,
      brand: { id: p.brandId, name: brand?.name ?? '' },
      status: p.status,
      amount: p.amount,
      currency: 'MAD',
      requestedAt: p.requestedAt,
      completedAt: p.completedAt,
    };
  }

  private creatorSummary(
    userId: string,
    user: UserRecord | null,
  ): PaymentBusinessRowDto['creator'] {
    return {
      id: userId,
      name: user?.fullName ?? '',
      avatarUrl: (user as unknown as { avatarUrl?: string })?.avatarUrl,
    };
  }
}
