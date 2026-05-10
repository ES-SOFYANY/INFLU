import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import type { AuthenticatedUser } from '../../shared/auth/types';

import { AdminValidationService } from './admin-validation.service';
import {
  CinValidationItemDto,
  ListCinValidationsQueryDto,
  PaginatedCinValidationsDto,
  RejectCinValidationDto,
} from './dto/admin-validation.dto';

@ApiTags('admin-validation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/validations')
export class AdminValidationController {
  constructor(private readonly service: AdminValidationService) {}

  // GET /admin/validations/cin?page=&limit=&status=
  @Get('cin')
  @ApiOperation({
    summary: 'List CIN validation requests (admin only). Defaults to PENDING.',
  })
  @ApiResponse({ status: 200, type: PaginatedCinValidationsDto })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN — requires ADMIN role' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCinValidationsQueryDto,
  ): Promise<PaginatedCinValidationsDto> {
    return this.service.listCinValidations(user.userId, query);
  }

  // POST /admin/validations/cin/:id/approve
  @Post('cin/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a pending CIN validation request (admin only).',
  })
  @ApiResponse({ status: 200, type: CinValidationItemDto })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INVALID_CIN_TRANSITION' })
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) userId: string,
  ): Promise<CinValidationItemDto> {
    return this.service.approveCinValidation(user.userId, userId);
  }

  // POST /admin/validations/cin/:id/reject
  @Post('cin/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject a pending CIN validation request (admin only).',
  })
  @ApiBody({ type: RejectCinValidationDto })
  @ApiResponse({ status: 200, type: CinValidationItemDto })
  @ApiResponse({ status: 400, description: 'VALIDATION_FAILED' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN' })
  @ApiResponse({ status: 404, description: 'NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'INVALID_CIN_TRANSITION' })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() dto: RejectCinValidationDto,
  ): Promise<CinValidationItemDto> {
    return this.service.rejectCinValidation(user.userId, userId, dto);
  }
}
