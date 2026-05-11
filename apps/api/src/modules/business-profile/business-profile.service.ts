import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuditService } from '../../shared/audit/audit.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import { BusinessProfileRepository } from './business-profile.repository';
import {
  STRONG_PASSWORD_REGEX,
  type BusinessAccountInfoDto,
  type BusinessDashboardKpisDto,
  type ChangeBusinessPasswordDto,
  type UpdateBusinessAccountInfoDto,
} from './dto';

@Injectable()
export class BusinessProfileService {
  constructor(
    private readonly repo: BusinessProfileRepository,
    private readonly audit: AuditService,
  ) {}

  // =====================================================================
  // US-100 — Dashboard KPIs (campaign counters)
  // =====================================================================

  async getDashboardKpis(userId: string): Promise<BusinessDashboardKpisDto> {
    const c = await this.repo.countCampaignsByStatus(userId);
    return {
      numberOfCampaigns: c.total,
      active: c.active,
      draft: c.draft,
      onHold: c.onHold,
      completed: c.completed,
      currency: 'MAD',
    };
  }

  // =====================================================================
  // US-170 — Account information
  // =====================================================================

  async getAccountInfo(userId: string): Promise<BusinessAccountInfoDto> {
    const row = await this.requireUserRow(userId);
    const legal = await this.repo.getBusinessLegal(userId);
    return {
      accountType: 'BUSINESS_ACCOUNT',
      email: row.email as string,
      fullName: (row.fullName as string) ?? '',
      gender: (row.gender as 'M' | 'F' | undefined) ?? undefined,
      phone: (row.phone as string | undefined) ?? undefined,
      address: (row.address as string | undefined) ?? undefined,
      businessInfo: {
        juridicalForm: legal?.juridicalForm ?? '',
        ice: legal?.ice ?? '',
        companyName: legal?.companyName ?? '',
        companyAddress: legal?.companyAddress ?? '',
        ifNumber: legal?.if ?? '',
        rc: legal?.rc ?? '',
        tva: legal?.tva ?? '',
      },
    };
  }

  async updateAccountInfo(
    userId: string,
    dto: UpdateBusinessAccountInfoDto,
  ): Promise<BusinessAccountInfoDto> {
    const patch: Record<string, unknown> = {};
    if (dto.fullName !== undefined) patch.fullName = dto.fullName;
    if (dto.gender !== undefined) patch.gender = dto.gender;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.address !== undefined) patch.address = dto.address;
    if (Object.keys(patch).length > 0) {
      await this.repo.updateProfileFields(userId, patch);
      await this.audit.append({
        actorUserId: userId,
        action: 'BUSINESS_ACCOUNT_INFO_UPDATE',
        resource: `USER#${userId}`,
        details: { fields: Object.keys(patch) },
      });
    }
    return this.getAccountInfo(userId);
  }

  // =====================================================================
  // US-170 — Change password
  // =====================================================================

  async changePassword(
    userId: string,
    dto: ChangeBusinessPasswordDto,
  ): Promise<void> {
    const row = await this.requireUserRow(userId);
    const currentHash = row.passwordHash as string | undefined;
    if (!currentHash) {
      throw new BusinessException(
        ERROR_CODES.PASSWORD_INVALID,
        'Current password is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const ok = await bcrypt.compare(dto.currentPassword, currentHash);
    if (!ok) {
      throw new BusinessException(
        ERROR_CODES.PASSWORD_INVALID,
        'Current password is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!STRONG_PASSWORD_REGEX.test(dto.newPassword)) {
      throw new BusinessException(
        ERROR_CODES.WEAK_PASSWORD,
        'Password must be at least 8 chars with 1 uppercase and 1 digit',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.repo.updateProfileFields(userId, { passwordHash: newHash });
    await this.audit.append({
      actorUserId: userId,
      action: 'BUSINESS_PASSWORD_CHANGE',
      resource: `USER#${userId}`,
    });
  }

  // =====================================================================
  // US-174 — Soft delete
  // =====================================================================

  async deleteAccount(userId: string): Promise<void> {
    const row = await this.requireUserRow(userId);
    await this.repo.softDeleteBusiness(userId, row.email as string);
    await this.audit.append({
      actorUserId: userId,
      action: 'BUSINESS_ACCOUNT_DELETE',
      resource: `USER#${userId}`,
    });
  }

  // =====================================================================
  // Helpers
  // =====================================================================

  private async requireUserRow(userId: string): Promise<Record<string, unknown>> {
    const row = await this.repo.getUserRow(userId);
    if (!row) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        'Business profile not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }
}
