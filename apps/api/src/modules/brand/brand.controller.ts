import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import type { AuthenticatedUser } from '../../shared/auth/types';

import { BrandService } from './brand.service';
import {
  BrandAccessDto,
  BrandSearchHitDto,
  BrandSummaryDto,
  GrantBrandAccessDto,
  LinkBrandDto,
} from './dto';

@ApiTags('brand')
@Controller('business/brands')
export class BrandController {
  constructor(private readonly service: BrandService) {}

  // ===== US-171: List my linked brands =====
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-171] List brands linked to my org' })
  @ApiResponse({ status: 200, type: BrandSummaryDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a business / agency' })
  listBrands(@CurrentUser() user: AuthenticatedUser): Promise<BrandSummaryDto[]> {
    return this.service.listLinkedBrands(user.userId);
  }

  // ===== US-172: Search the brand catalogue =====
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-172] Search brand catalogue (max 10 hits)' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiResponse({ status: 200, type: BrandSearchHitDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Missing/empty query' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a business / agency' })
  searchBrands(
    @CurrentUser() user: AuthenticatedUser,
    @Query('q') q?: string,
  ): Promise<BrandSearchHitDto[]> {
    return this.service.searchBrands(user.userId, q ?? '');
  }

  // ===== US-172: Link a brand to my org =====
  @Post('link')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-172] Link an existing brand to my org' })
  @ApiBody({ type: LinkBrandDto })
  @ApiResponse({ status: 201, type: BrandSummaryDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a business / agency' })
  @ApiResponse({ status: 404, description: 'BRAND_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'BRAND_ALREADY_LINKED' })
  linkBrand(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LinkBrandDto,
  ): Promise<BrandSummaryDto> {
    return this.service.linkBrand(user.userId, dto.brandId);
  }

  // ===== US-173: List access on a brand =====
  @Get(':id/access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-173] List members with access to a brand' })
  @ApiResponse({ status: 200, type: BrandAccessDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({
    status: 403,
    description: 'Caller is not a business / agency or brand not linked',
  })
  @ApiResponse({ status: 404, description: 'BRAND_NOT_FOUND' })
  listAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BrandAccessDto[]> {
    return this.service.listAccess(user.userId, id);
  }

  // ===== US-173: Grant access to a member =====
  @Post(':id/access')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-173] Grant a brand access to a user' })
  @ApiBody({ type: GrantBrandAccessDto })
  @ApiResponse({ status: 201, type: BrandAccessDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({
    status: 403,
    description: 'Caller is not a business / agency or brand not linked',
  })
  @ApiResponse({ status: 404, description: 'BRAND_NOT_FOUND or USER_NOT_FOUND' })
  grantAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: GrantBrandAccessDto,
  ): Promise<BrandAccessDto> {
    return this.service.grantAccess(user.userId, id, dto);
  }
}
