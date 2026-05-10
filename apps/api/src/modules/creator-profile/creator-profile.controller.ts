import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import type { AuthenticatedUser } from '../../shared/auth/types';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import { CreatorProfileService } from './creator-profile.service';
import {
  CreatorDashboardKpisDto,
  CreatorProfileOverviewDto,
  LinkSocialAccountDto,
  SocialAccountDto,
  SocialCoverageRowDto,
  UpdateCreatorProfileOverviewDto,
} from './dto';

import type { SocialPlatform } from '@my-app/shared-types';

const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  'INSTAGRAM',
  'YOUTUBE',
  'TIKTOK',
  'TWITTER',
];

@ApiTags('creator-profile')
@Controller('creator')
export class CreatorProfileController {
  constructor(private readonly service: CreatorProfileService) {}

  // ----- US-017: Link a social account -----
  @Post('me/social-accounts/:platform/link')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-017] Link a social account (mock OAuth)' })
  @ApiBody({ type: LinkSocialAccountDto })
  @ApiResponse({ status: 201, type: SocialAccountDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'OAuth exchange failed' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  @ApiResponse({ status: 409, description: 'SOCIAL_ALREADY_LINKED' })
  linkSocial(
    @CurrentUser() user: AuthenticatedUser,
    @Param('platform') platform: string,
    @Body() dto: LinkSocialAccountDto,
  ): Promise<SocialAccountDto> {
    if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) {
      throw new BusinessException(
        ERROR_CODES.VALIDATION_FAILED,
        `Unknown platform "${platform}". Allowed: ${SOCIAL_PLATFORMS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.service.linkSocialAccount(user.userId, platform as SocialPlatform, dto);
  }

  // ----- US-020: Dashboard KPIs -----
  @Get('me/dashboard-kpis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-020] Read the 10 creator dashboard KPIs' })
  @ApiResponse({ status: 200, type: CreatorDashboardKpisDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  getDashboardKpis(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CreatorDashboardKpisDto> {
    return this.service.getDashboardKpis(user.userId);
  }

  // ----- US-041: Profile overview (read) -----
  @Get('me/profile-overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-041] Read the creator profile overview' })
  @ApiResponse({ status: 200, type: CreatorProfileOverviewDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  getProfileOverview(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CreatorProfileOverviewDto> {
    return this.service.getProfileOverview(user.userId);
  }

  // ----- US-041: Profile overview (update) -----
  @Patch('me/profile-overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-041] Update the creator profile overview' })
  @ApiBody({ type: UpdateCreatorProfileOverviewDto })
  @ApiResponse({ status: 200, type: CreatorProfileOverviewDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  updateProfileOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCreatorProfileOverviewDto,
  ): Promise<CreatorProfileOverviewDto> {
    return this.service.updateProfileOverview(user.userId, dto);
  }

  // ----- US-041: Social Coverage table -----
  @Get('me/social-coverage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-041] Read the social coverage table' })
  @ApiResponse({ status: 200, type: SocialCoverageRowDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  getSocialCoverage(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SocialCoverageRowDto[]> {
    return this.service.getSocialCoverage(user.userId);
  }
}
