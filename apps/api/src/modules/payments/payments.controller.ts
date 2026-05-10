import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import type { AuthenticatedUser } from '../../shared/auth/types';

import {
  ListBusinessPaymentsQueryDto,
  ListCreatorPaymentsQueryDto,
  PaginatedBusinessPaymentsDto,
  PaginatedCreatorPaymentsDto,
} from './dto';
import { PaymentsService } from './payments.service';

/**
 * US-160 / US-161 — `/business/payments` (BUSINESS|AGENCY only).
 */
@ApiTags('payments')
@Controller('business/payments')
export class BusinessPaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[US-160][US-161] List business payments by tab (Marketplace|Campaign), brand, status',
  })
  @ApiResponse({ status: 200, type: PaginatedBusinessPaymentsDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListBusinessPaymentsQueryDto,
  ): Promise<PaginatedBusinessPaymentsDto> {
    return this.service.listBusinessPayments(user.userId, query);
  }
}

/**
 * US-160 — `/creator/me/payments` (CREATOR only).
 */
@ApiTags('payments')
@Controller('creator/me/payments')
export class CreatorPaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-160] List my payments (creator)' })
  @ApiResponse({ status: 200, type: PaginatedCreatorPaymentsDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCreatorPaymentsQueryDto,
  ): Promise<PaginatedCreatorPaymentsDto> {
    return this.service.listCreatorPayments(user.userId, query);
  }
}

/**
 * Legacy controller kept so the module import is stable. Routes live in the
 * dedicated business/creator controllers above.
 */
@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}
}
