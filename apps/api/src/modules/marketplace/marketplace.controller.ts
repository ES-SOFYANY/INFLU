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
  ListMarketplaceProductsQueryDto,
  MarketplaceProductDetailDto,
  PaginatedMarketplaceProductsDto,
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
