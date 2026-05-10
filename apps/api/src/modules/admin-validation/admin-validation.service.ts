import { HttpStatus, Injectable } from '@nestjs/common';

import { AuditService } from '../../shared/audit/audit.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';
import { AuthRepository } from '../auth/auth.repository';
import { CreatorProfileRepository } from '../creator-profile/creator-profile.repository';

import { AdminValidationRepository } from './admin-validation.repository';
import type {
  CinValidationItemDto,
  ListCinValidationsQueryDto,
  PaginatedCinValidationsDto,
  RejectCinValidationDto,
} from './dto/admin-validation.dto';

const DEFAULT_LIMIT = 20;

@Injectable()
export class AdminValidationService {
  constructor(
    private readonly repo: AdminValidationRepository,
    private readonly authRepo: AuthRepository,
    private readonly creatorRepo: CreatorProfileRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * GET /admin/validations/cin — paginated listing filtered by status
   * (default PENDING). Newest first (DESC by submittedAt).
   */
  async listCinValidations(
    actorUserId: string,
    query: ListCinValidationsQueryDto,
  ): Promise<PaginatedCinValidationsDto> {
    const status = query.status ?? 'PENDING';
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? DEFAULT_LIMIT));
    const all = await this.repo.listCinValidationRequests(status);
    const start = (page - 1) * limit;
    const slice = all.slice(start, start + limit);
    const items: CinValidationItemDto[] = await Promise.all(
      slice.map(async (rec) => {
        let fullName = rec.fullName ?? '';
        if (!fullName) {
          const u = await this.authRepo.findById(rec.userId);
          fullName = u?.fullName ?? '';
        }
        return {
          userId: rec.userId,
          fullName,
          cinNumber: rec.cinNumber ?? '',
          dateOfExpiry: rec.dateOfExpiry ?? '',
          status: rec.status,
          submittedAt: rec.submittedAt,
          rejectionReason: rec.rejectionReason,
        };
      }),
    );
    const hasMore = start + limit < all.length;
    await this.audit.append({
      actorUserId,
      action: 'ADMIN_LIST_CIN_VALIDATIONS',
      resource: 'AdminValidation#CIN',
      details: { status, page, limit, total: all.length },
    });
    return {
      items,
      nextCursor: hasMore ? page + 1 : null,
    };
  }

  async approveCinValidation(
    actorUserId: string,
    userId: string,
  ): Promise<CinValidationItemDto> {
    const req = await this.repo.getCinValidationRequest(userId);
    if (!req) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        `No CIN validation request found for user ${userId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (req.status !== 'PENDING') {
      throw new BusinessException(
        ERROR_CODES.INVALID_CIN_TRANSITION,
        `CIN validation request is in status ${req.status}, cannot approve`,
        HttpStatus.CONFLICT,
        { currentStatus: req.status },
      );
    }
    await this.repo.updateCinValidationStatus(userId, 'APPROVED');
    await this.creatorRepo.updateCinStatus(userId, 'VALIDATED');
    await this.audit.append({
      actorUserId,
      action: 'ADMIN_APPROVE_CIN',
      resource: `USER#${userId}`,
    });
    const updated = await this.repo.getCinValidationRequest(userId);
    return this.toItem(updated!);
  }

  async rejectCinValidation(
    actorUserId: string,
    userId: string,
    dto: RejectCinValidationDto,
  ): Promise<CinValidationItemDto> {
    const req = await this.repo.getCinValidationRequest(userId);
    if (!req) {
      throw new BusinessException(
        ERROR_CODES.NOT_FOUND,
        `No CIN validation request found for user ${userId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (req.status !== 'PENDING') {
      throw new BusinessException(
        ERROR_CODES.INVALID_CIN_TRANSITION,
        `CIN validation request is in status ${req.status}, cannot reject`,
        HttpStatus.CONFLICT,
        { currentStatus: req.status },
      );
    }
    await this.repo.updateCinValidationStatus(userId, 'REJECTED', dto.reason);
    await this.creatorRepo.rejectCinDocument(userId, dto.reason);
    await this.audit.append({
      actorUserId,
      action: 'ADMIN_REJECT_CIN',
      resource: `USER#${userId}`,
      details: { reason: dto.reason },
    });
    const updated = await this.repo.getCinValidationRequest(userId);
    return this.toItem(updated!);
  }

  private toItem(rec: {
    userId: string;
    fullName?: string;
    cinNumber?: string;
    dateOfExpiry?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    submittedAt: string;
    rejectionReason?: string;
  }): CinValidationItemDto {
    return {
      userId: rec.userId,
      fullName: rec.fullName ?? '',
      cinNumber: rec.cinNumber ?? '',
      dateOfExpiry: rec.dateOfExpiry ?? '',
      status: rec.status,
      submittedAt: rec.submittedAt,
      rejectionReason: rec.rejectionReason,
    };
  }
}
