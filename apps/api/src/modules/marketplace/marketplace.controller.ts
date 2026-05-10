import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  ApplicationDto,
  CreateMarketplaceProductDto,
  ListCollaborationsQueryDto,
  ListMarketplaceProductsQueryDto,
  ListMyMarketplaceProductsQueryDto,
  MarketplaceProductDetailDto,
  MarketplaceProductWizardDto,
  PaginatedCollaborationsDto,
  PaginatedMarketplaceProductsDto,
  UpdateMarketplaceProductDto,
} from './dto';
import { MarketplaceService } from './marketplace.service';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  // ----- US-030: Browse marketplace products -----
  @Get('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-030] List published marketplace products' })
  @ApiResponse({ status: 200, type: PaginatedMarketplaceProductsDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  listProducts(
    @Query() query: ListMarketplaceProductsQueryDto,
  ): Promise<PaginatedMarketplaceProductsDto> {
    return this.service.listProducts(query);
  }

  // ----- US-031 / US-034 / US-035: Product detail -----
  @Get('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[US-031][US-034][US-035] Get a marketplace opportunity (paidByInflu=true, isExpired computed)',
  })
  @ApiResponse({ status: 200, type: MarketplaceProductDetailDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  @ApiResponse({ status: 404, description: 'PRODUCT_NOT_FOUND' })
  getProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MarketplaceProductDetailDto> {
    return this.service.getProduct(id);
  }

  // ----- US-032 / US-033: Apply -----
  @Post('products/:id/apply')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[US-032][US-033] Apply to a marketplace opportunity (CIN+RIB+ICE required)',
  })
  @ApiResponse({ status: 201, type: ApplicationDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  @ApiResponse({ status: 404, description: 'PRODUCT_NOT_FOUND' })
  @ApiResponse({
    status: 409,
    description: 'PROFILE_INCOMPLETE | NO_SLOTS_LEFT | ALREADY_APPLIED',
  })
  @ApiResponse({ status: 410, description: 'PRODUCT_EXPIRED' })
  apply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() _body: Record<string, never> = {},
  ): Promise<ApplicationDto> {
    return this.service.applyToProduct(user.userId, id);
  }
}

/**
 * US-120 / US-121 / US-122 — Business-side endpoints (`/business/marketplace`).
 * Mounted as a separate controller so role guards (`BUSINESS|AGENCY`) and
 * URL prefix differ from the public creator-facing endpoints above.
 */
@ApiTags('marketplace')
@Controller('business/marketplace')
export class BusinessMarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  // ----- US-122: My Marketplace -----
  @Get('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-122] List my marketplace products' })
  @ApiResponse({ status: 200, type: PaginatedMarketplaceProductsDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMyMarketplaceProductsQueryDto,
  ): Promise<PaginatedMarketplaceProductsDto> {
    return this.service.listMyProducts(user.userId, query);
  }

  // ----- US-120: Create draft (wizard step 1) -----
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-120] Create a DRAFT marketplace product (step BRAND_INFO)' })
  @ApiResponse({ status: 201, type: MarketplaceProductWizardDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  @ApiResponse({ status: 404, description: 'BRAND_NOT_FOUND' })
  createDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMarketplaceProductDto,
  ): Promise<MarketplaceProductWizardDto> {
    return this.service.createDraftProduct(user.userId, dto);
  }

  // ----- US-120: Get one of my products -----
  @Get('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-120/US-122] Get one of my marketplace products' })
  @ApiResponse({ status: 200, type: MarketplaceProductWizardDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'PRODUCT_NOT_FOUND' })
  getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MarketplaceProductWizardDto> {
    return this.service.getOwnedProduct(user.userId, id);
  }

  // ----- US-120 / US-121: Save wizard step -----
  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[US-120/US-121] Save a wizard step (BRAND_INFO|PRODUCT_DETAILS|ACCEPTANCE_CRITERIA|DELIVERABLES|DATES)',
  })
  @ApiResponse({ status: 200, type: MarketplaceProductWizardDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'PRODUCT_NOT_FOUND' })
  @ApiResponse({
    status: 422,
    description: 'WIZARD_INCOMPLETE | INVALID_DELIVERABLE',
  })
  saveStep(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMarketplaceProductDto,
  ): Promise<MarketplaceProductWizardDto> {
    return this.service.updateWizardStep(user.userId, id, dto);
  }

  // ----- US-120: Publish -----
  @Post('products/:id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-120] Publish a draft marketplace product' })
  @ApiResponse({ status: 200, type: MarketplaceProductWizardDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'PRODUCT_NOT_FOUND' })
  @ApiResponse({ status: 422, description: 'WIZARD_INCOMPLETE' })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MarketplaceProductWizardDto> {
    return this.service.publishProduct(user.userId, id);
  }

  // ----- US-120: Soft-delete -----
  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-120] Soft-delete a marketplace product' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'PRODUCT_NOT_FOUND' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.service.deleteProduct(user.userId, id);
  }
}

/**
 * US-040 — Creator-side collaboration list (`/creator/me/collaborations`).
 * Mounted as a separate controller from `CreatorProfileController` to avoid a
 * circular dependency between Marketplace and CreatorProfile modules.
 */
@ApiTags('creator-profile')
@Controller('creator')
export class CreatorCollaborationsController {
  constructor(private readonly service: MarketplaceService) {}

  @Get('me/collaborations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-040] List my collaborations (creator)' })
  @ApiResponse({ status: 200, type: PaginatedCollaborationsDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  listMyCollaborations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCollaborationsQueryDto,
  ): Promise<PaginatedCollaborationsDto> {
    return this.service.listMyCollaborations(user.userId, query);
  }
}
