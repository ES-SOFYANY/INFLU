import { Injectable } from '@nestjs/common';

import { CreatorProfileRepository } from './creator-profile.repository';

export type EligibilityMissing = 'CIN' | 'RIB' | 'ICE';

export interface EligibilityResult {
  canApply: boolean;
  missing: EligibilityMissing[];
}

/**
 * US-032 — Eligibility for marketplace `Apply`.
 * The triple prerequisite is: CIN VALIDATED ∧ RIB uploaded ∧ ICE filled.
 * Any other CIN status (NONE, PENDING_VALIDATION, CANCELLED, REJECTED) blocks.
 *
 * This service is exported by `CreatorProfileModule` so other modules
 * (Marketplace) can check eligibility without coupling to internal repos.
 */
@Injectable()
export class CreatorEligibilityService {
  constructor(private readonly repo: CreatorProfileRepository) {}

  async checkApplyEligibility(userId: string): Promise<EligibilityResult> {
    const [profileRow, cinDoc] = await Promise.all([
      this.repo.getUserRow(userId),
      this.repo.getCinDocument(userId),
    ]);

    const missing: EligibilityMissing[] = [];

    if (!cinDoc || cinDoc.status !== 'VALIDATED') {
      missing.push('CIN');
    }

    const ribUploaded = Boolean(profileRow?.ribUploaded);
    if (!ribUploaded) {
      missing.push('RIB');
    }

    const billingIce = profileRow?.billingIce as string | undefined;
    if (!billingIce) {
      missing.push('ICE');
    }

    return { canApply: missing.length === 0, missing };
  }
}
