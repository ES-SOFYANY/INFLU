import { HttpStatus, Injectable } from '@nestjs/common';

import { AuditService } from '../../shared/audit/audit.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';
import { v4 as uuidv4 } from '../auth/uuid';

import {
  BrandRepository,
  type BrandAccessRecord,
  type BrandRecord,
} from './brand.repository';
import {
  type BrandAccessDto,
  type BrandSearchHitDto,
  type BrandSummaryDto,
  type GrantBrandAccessDto,
} from './dto';

interface SeedBrandSpec {
  name: string;
  socialHandle?: string;
  website?: string;
  industry?: string;
}

const DEFAULT_BRAND_SEED: readonly SeedBrandSpec[] = [
  {
    name: 'Yassir',
    socialHandle: '@yassir',
    website: 'https://yassir.com',
    industry: 'Mobility',
  },
  {
    name: 'Eucerin',
    socialHandle: '@eucerin',
    website: 'https://www.eucerin.com',
    industry: 'Beauty',
  },
  {
    name: 'NUXE',
    socialHandle: '@nuxe',
    website: 'https://www.nuxe.com',
    industry: 'Beauty',
  },
  {
    name: 'LA SALLE',
    socialHandle: '@lasalle',
    website: 'https://www.lasalle.ma',
    industry: 'Education',
  },
];

@Injectable()
export class BrandService {
  constructor(
    private readonly repo: BrandRepository,
    private readonly audit: AuditService,
  ) {}

  // =====================================================================
  // US-171 — List brands linked to my org
  // =====================================================================

  async listLinkedBrands(orgId: string): Promise<BrandSummaryDto[]> {
    const links = await this.repo.listOrgLinks(orgId);
    const out: BrandSummaryDto[] = [];
    for (const link of links) {
      const brand = await this.repo.getBrand(link.brandId);
      if (!brand) continue;
      const access = await this.repo.listBrandAccess(brand.id);
      const mine = access.find((a) => a.userId === orgId);
      out.push({
        id: brand.id,
        name: brand.name,
        socialHandle: brand.socialHandle,
        website: brand.website,
        country: brand.country,
        logoUrl: brand.logoUrl,
        accessControl: {
          members: access.length,
          myRole: mine?.role ?? 'OWNER',
        },
      });
    }
    return out;
  }

  // =====================================================================
  // US-172 — Search brand catalogue (auto-seeds when empty)
  // =====================================================================

  async searchBrands(orgId: string, q: string): Promise<BrandSearchHitDto[]> {
    if (!q || q.trim().length < 1) {
      throw new BusinessException(
        ERROR_CODES.VALIDATION_FAILED,
        'Query parameter "q" is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if ((await this.repo.countBrands()) === 0) {
      await this.autoSeedDefaults();
    }
    const hits = await this.repo.searchBrands(q.trim());
    const linked = new Set(
      (await this.repo.listOrgLinks(orgId)).map((l) => l.brandId),
    );
    return hits.map((b) => ({
      id: b.id,
      name: b.name,
      socialHandle: b.socialHandle,
      website: b.website,
      country: b.country,
      logoUrl: b.logoUrl,
      alreadyLinked: linked.has(b.id),
    }));
  }

  // =====================================================================
  // US-172 — Link an existing brand to my org
  // =====================================================================

  async linkBrand(orgId: string, brandId: string): Promise<BrandSummaryDto> {
    const brand = await this.repo.getBrand(brandId);
    if (!brand) {
      throw new BusinessException(
        ERROR_CODES.BRAND_NOT_FOUND,
        `Brand ${brandId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    try {
      await this.repo.putOrgLink({
        orgId,
        brandId,
        linkedAt: new Date().toISOString(),
      });
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'ConditionalCheckFailedException') {
        throw new BusinessException(
          ERROR_CODES.BRAND_ALREADY_LINKED,
          'Brand already linked to this org',
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }

    // Caller becomes OWNER on this brand.
    const existing = await this.repo.getBrandAccess(brandId, orgId);
    if (!existing) {
      await this.repo.putBrandAccess({
        brandId,
        userId: orgId,
        email: '',
        role: 'OWNER',
        invitedBy: orgId,
        invitedAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
      });
    }

    await this.audit.append({
      actorUserId: orgId,
      action: 'BRAND_LINK',
      resource: `BRAND#${brandId}`,
      details: { name: brand.name },
    });

    const access = await this.repo.listBrandAccess(brandId);
    return {
      id: brand.id,
      name: brand.name,
      socialHandle: brand.socialHandle,
      website: brand.website,
      country: brand.country,
      logoUrl: brand.logoUrl,
      accessControl: { members: access.length, myRole: 'OWNER' },
    };
  }

  // =====================================================================
  // US-173 — Manage / grant access
  // =====================================================================

  async listAccess(orgId: string, brandId: string): Promise<BrandAccessDto[]> {
    await this.requireBrandLinkedToOrg(orgId, brandId);
    const access = await this.repo.listBrandAccess(brandId);
    return access.map((a) => this.toAccessDto(a));
  }

  async grantAccess(
    orgId: string,
    brandId: string,
    dto: GrantBrandAccessDto,
  ): Promise<BrandAccessDto> {
    await this.requireBrandLinkedToOrg(orgId, brandId);
    const target = await this.repo.findUserByEmail(dto.email.toLowerCase());
    if (!target) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        `No user found for email ${dto.email}`,
        HttpStatus.NOT_FOUND,
        { code: 'USER_NOT_FOUND' },
      );
    }
    const now = new Date().toISOString();
    const record: BrandAccessRecord = {
      brandId,
      userId: target.id,
      email: target.email,
      fullName: target.fullName,
      role: dto.role,
      invitedBy: orgId,
      invitedAt: now,
      acceptedAt: now, // MVP: immediate access (no email flow)
    };
    await this.repo.putBrandAccess(record);
    await this.audit.append({
      actorUserId: orgId,
      action: 'BRAND_ACCESS_GRANT',
      resource: `BRAND#${brandId}`,
      details: { targetUserId: target.id, role: dto.role },
    });
    return this.toAccessDto(record);
  }

  // =====================================================================
  // Helpers
  // =====================================================================

  private toAccessDto(r: BrandAccessRecord): BrandAccessDto {
    return {
      userId: r.userId,
      email: r.email,
      fullName: r.fullName,
      role: r.role,
      invitedAt: r.invitedAt,
      acceptedAt: r.acceptedAt,
    };
  }

  private async requireBrandLinkedToOrg(
    orgId: string,
    brandId: string,
  ): Promise<void> {
    const brand = await this.repo.getBrand(brandId);
    if (!brand) {
      throw new BusinessException(
        ERROR_CODES.BRAND_NOT_FOUND,
        `Brand ${brandId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    const link = await this.repo.getOrgLink(orgId, brandId);
    if (!link) {
      throw new BusinessException(
        ERROR_CODES.FORBIDDEN,
        'Brand is not linked to your org',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async autoSeedDefaults(): Promise<void> {
    const now = new Date().toISOString();
    for (const spec of DEFAULT_BRAND_SEED) {
      const record: BrandRecord = {
        id: uuidv4(),
        name: spec.name,
        nameNormalized: BrandRepository.normalize(spec.name),
        slug: BrandRepository.normalize(spec.name).replace(/\s+/g, '-'),
        socialHandle: spec.socialHandle,
        website: spec.website,
        country: 'MA',
        industry: spec.industry,
        status: 'APPROVED',
        createdAt: now,
        updatedAt: now,
      };
      try {
        await this.repo.putBrand(record);
      } catch {
        // ignore — concurrent seed attempts are fine
      }
    }
  }
}
