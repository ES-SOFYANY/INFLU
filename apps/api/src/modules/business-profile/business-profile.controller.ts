import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
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

import { BusinessProfileService } from './business-profile.service';
import {
  BusinessAccountInfoDto,
  BusinessDashboardKpisDto,
  ChangeBusinessPasswordDto,
  UpdateBusinessAccountInfoDto,
} from './dto';

@ApiTags('business-profile')
@Controller('business')
export class BusinessProfileController {
  constructor(private readonly service: BusinessProfileService) {}

  // ===== US-100: Dashboard KPIs =====
  @Get('me/dashboard-kpis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-100] Read business dashboard KPI counters' })
  @ApiResponse({ status: 200, type: BusinessDashboardKpisDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a business / agency' })
  getDashboardKpis(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BusinessDashboardKpisDto> {
    return this.service.getDashboardKpis(user.userId);
  }

  // ===== US-170: Account information =====
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-170] Get business account information' })
  @ApiResponse({ status: 200, type: BusinessAccountInfoDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a business / agency' })
  getAccountInfo(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BusinessAccountInfoDto> {
    return this.service.getAccountInfo(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[US-170] Update business account info (email + businessInfo are read-only)',
  })
  @ApiBody({ type: UpdateBusinessAccountInfoDto })
  @ApiResponse({ status: 200, type: BusinessAccountInfoDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a business / agency' })
  updateAccountInfo(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBusinessAccountInfoDto,
  ): Promise<BusinessAccountInfoDto> {
    return this.service.updateAccountInfo(user.userId, dto);
  }

  // ===== US-170: Change password =====
  @Post('me/password/change')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-170] Change my business account password' })
  @ApiBody({ type: ChangeBusinessPasswordDto })
  @ApiResponse({ status: 204, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Current password invalid' })
  @ApiResponse({ status: 403, description: 'Caller is not a business / agency' })
  @ApiResponse({ status: 422, description: 'New password is too weak' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeBusinessPasswordDto,
  ): Promise<void> {
    await this.service.changePassword(user.userId, dto);
  }

  // ===== US-174: Soft-delete account =====
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-174] Soft-delete my business account' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a business / agency' })
  async deleteAccount(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.service.deleteAccount(user.userId);
  }
}
