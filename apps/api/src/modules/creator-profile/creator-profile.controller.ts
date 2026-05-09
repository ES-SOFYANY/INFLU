import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
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
import { LinkSocialAccountDto, SocialAccountDto } from './dto';

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
}
