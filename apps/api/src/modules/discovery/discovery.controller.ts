import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';

import { DiscoveryService } from './discovery.service';
import {
  DiscoveryPublicCreatorProfileDto,
  DiscoveryQueryDto,
  PaginatedDiscoveryCreatorsDto,
} from './dto';

@ApiTags('discovery')
@Controller('business/discovery')
export class DiscoveryController {
  constructor(private readonly service: DiscoveryService) {}

  // ----- US-130/US-131 -----
  @Get('creators')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[US-130] Search creators (URL-bookmarkable)',
  })
  @ApiResponse({ status: 200, type: PaginatedDiscoveryCreatorsDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS / AGENCY' })
  searchCreators(
    @Query() query: DiscoveryQueryDto,
  ): Promise<PaginatedDiscoveryCreatorsDto> {
    return this.service.searchCreators(query);
  }

  // ----- US-132 -----
  @Get('creators/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[US-132] Get a public creator profile (business/agency view)',
  })
  @ApiResponse({ status: 200, type: DiscoveryPublicCreatorProfileDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS / AGENCY' })
  @ApiResponse({ status: 404, description: 'Creator not found' })
  getPublicProfile(
    @Param('id') id: string,
  ): Promise<DiscoveryPublicCreatorProfileDto> {
    return this.service.getPublicProfile(id);
  }
}
