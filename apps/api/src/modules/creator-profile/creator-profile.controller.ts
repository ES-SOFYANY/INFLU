import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
  ChangePasswordDto,
  CinStatusDto,
  CreatorAccountInfoDto,
  CreatorBillingDto,
  CreatorDashboardKpisDto,
  CreatorProfileOverviewDto,
  CreatorReportDto,
  IceApproveDto,
  IceSearchDto,
  IceSearchResultDto,
  LinkSocialAccountDto,
  PricingDto,
  SocialAccountDto,
  SocialCoverageRowDto,
  SubmitCinDto,
  UpdateCreatorAccountInfoDto,
  UpdateCreatorProfileOverviewDto,
  UpdatePricingDto,
  UploadUrlDto,
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

  // ----- US-043: Creator Report -----
  @Get('me/creator-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-043] Read the printable Creator Report' })
  @ApiResponse({ status: 200, type: CreatorReportDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  getCreatorReport(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CreatorReportDto> {
    return this.service.getCreatorReport(user.userId);
  }

  // ===== US-070: Account information =====
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-070] Get creator account information' })
  @ApiResponse({ status: 200, type: CreatorAccountInfoDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  getAccountInfo(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CreatorAccountInfoDto> {
    return this.service.getAccountInfo(user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[US-070] Update creator account information (email is read-only and silently ignored)',
  })
  @ApiBody({ type: UpdateCreatorAccountInfoDto })
  @ApiResponse({ status: 200, type: CreatorAccountInfoDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  updateAccountInfo(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCreatorAccountInfoDto,
  ): Promise<CreatorAccountInfoDto> {
    return this.service.updateAccountInfo(user.userId, dto);
  }

  // ===== US-076: Soft-delete account =====
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-076] Soft-delete my creator account' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  async deleteAccount(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.service.deleteAccount(user.userId);
  }

  // ===== US-071: Change password =====
  @Post('me/password/change')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-071] Change my password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 204, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Current password invalid' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  @ApiResponse({ status: 422, description: 'New password is too weak' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.service.changePassword(user.userId, dto);
  }

  // ===== US-072: Billing / ICE =====
  @Post('me/billing/ice/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-072] Lookup an ICE in the registry (mock)' })
  @ApiBody({ type: IceSearchDto })
  @ApiResponse({ status: 200, type: IceSearchResultDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'ICE_NOT_FOUND' })
  searchIce(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IceSearchDto,
  ): Promise<IceSearchResultDto> {
    return this.service.searchIce(user.userId, dto);
  }

  @Post('me/billing/ice/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-072] Approve an ICE for my billing profile' })
  @ApiBody({ type: IceApproveDto })
  @ApiResponse({ status: 200, type: CreatorBillingDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  approveIce(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IceApproveDto,
  ): Promise<CreatorBillingDto> {
    return this.service.approveIce(user.userId, dto);
  }

  @Get('me/billing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-072] Get my billing profile' })
  @ApiResponse({ status: 200, type: CreatorBillingDto })
  getBilling(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CreatorBillingDto> {
    return this.service.getBilling(user.userId);
  }

  // ===== US-073: Pricing =====
  @Get('me/pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-073] Get my pricing grid' })
  @ApiResponse({ status: 200, type: PricingDto })
  getPricing(@CurrentUser() user: AuthenticatedUser): Promise<PricingDto> {
    return this.service.getPricing(user.userId);
  }

  @Put('me/pricing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-073] Replace my pricing grid' })
  @ApiBody({ type: UpdatePricingDto })
  @ApiResponse({ status: 200, type: PricingDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  updatePricing(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePricingDto,
  ): Promise<PricingDto> {
    return this.service.updatePricing(user.userId, dto);
  }

  // ===== US-074 / US-075: CIN documents =====
  @Get('me/documents/cin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-074] Get my CIN status' })
  @ApiResponse({ status: 200, type: CinStatusDto })
  getCin(@CurrentUser() user: AuthenticatedUser): Promise<CinStatusDto> {
    return this.service.getCin(user.userId);
  }

  @Post('me/documents/cin')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-074] Submit my CIN for admin validation' })
  @ApiBody({ type: SubmitCinDto })
  @ApiResponse({ status: 201, type: CinStatusDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  submitCin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitCinDto,
  ): Promise<CinStatusDto> {
    return this.service.submitCin(user.userId, dto);
  }

  @Post('me/documents/cin/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-075] Cancel my pending CIN validation' })
  @ApiResponse({ status: 200, type: CinStatusDto })
  @ApiResponse({ status: 409, description: 'INVALID_CIN_TRANSITION' })
  cancelCin(@CurrentUser() user: AuthenticatedUser): Promise<CinStatusDto> {
    return this.service.cancelCin(user.userId);
  }

  @Post('me/documents/rib/upload-url')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-074] Request a mock pre-signed S3 URL for RIB upload' })
  @ApiResponse({ status: 200, type: UploadUrlDto })
  ribUploadUrl(@CurrentUser() _user: AuthenticatedUser): UploadUrlDto {
    return this.service.ribUploadUrl();
  }

  @Post('me/documents/tax-certificate/upload-url')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[US-074] Request a mock pre-signed S3 URL for tax-certificate upload',
  })
  @ApiResponse({ status: 200, type: UploadUrlDto })
  taxCertificateUploadUrl(@CurrentUser() _user: AuthenticatedUser): UploadUrlDto {
    return this.service.taxCertificateUploadUrl();
  }
}
