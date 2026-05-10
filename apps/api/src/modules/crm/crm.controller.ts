import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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

import { CrmService } from './crm.service';
import {
  CreateCrmListDto,
  CrmListDetailDto,
  CrmListDto,
  ListCrmListsQueryDto,
  PaginatedCrmListsDto,
} from './dto';

@ApiTags('crm')
@Controller('business/crm')
export class CrmController {
  constructor(private readonly service: CrmService) {}

  // ----- US-140: list -----
  @Get('lists')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-140] List my CRM lists' })
  @ApiResponse({ status: 200, type: PaginatedCrmListsDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  listLists(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCrmListsQueryDto,
  ): Promise<PaginatedCrmListsDto> {
    return this.service.listMyLists(user.userId, query);
  }

  // ----- US-140: detail -----
  @Get('lists/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-140] Get a CRM list with creators' })
  @ApiResponse({ status: 200, type: CrmListDetailDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  @ApiResponse({ status: 404, description: 'LIST_NOT_FOUND' })
  getList(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CrmListDetailDto> {
    return this.service.getListDetail(user.userId, id);
  }

  // ----- US-141: create -----
  @Post('lists')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-141] Create a CRM list' })
  @ApiBody({ type: CreateCrmListDto })
  @ApiResponse({ status: 201, type: CrmListDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  createList(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCrmListDto,
  ): Promise<CrmListDto> {
    return this.service.createList(user.userId, dto);
  }

  // ----- US-141: update -----
  @Put('lists/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-141] Update a CRM list (title/description)' })
  @ApiBody({ type: CreateCrmListDto })
  @ApiResponse({ status: 200, type: CrmListDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  @ApiResponse({ status: 404, description: 'LIST_NOT_FOUND' })
  updateList(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateCrmListDto,
  ): Promise<CrmListDto> {
    return this.service.updateList(user.userId, id, dto);
  }

  // ----- US-141: soft delete -----
  @Delete('lists/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-141] Soft-delete a CRM list' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  @ApiResponse({ status: 404, description: 'LIST_NOT_FOUND' })
  async deleteList(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.service.deleteList(user.userId, id);
  }

  // ----- US-142: add creator -----
  @Post('lists/:id/creators/:creatorId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-142] Add a creator to a CRM list' })
  @ApiResponse({ status: 201, description: 'Added' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  @ApiResponse({ status: 404, description: 'LIST_NOT_FOUND | CREATOR_NOT_FOUND' })
  @ApiResponse({ status: 409, description: 'ALREADY_IN_LIST' })
  addCreator(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('creatorId', new ParseUUIDPipe()) creatorId: string,
  ): Promise<{ listId: string; creatorId: string; addedAt: string }> {
    return this.service.addCreatorToList(user.userId, id, creatorId);
  }

  // ----- US-142: remove creator -----
  @Delete('lists/:id/creators/:creatorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-142] Remove a creator from a CRM list' })
  @ApiResponse({ status: 204, description: 'Removed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  @ApiResponse({ status: 404, description: 'LIST_NOT_FOUND | CREATOR_NOT_FOUND' })
  async removeCreator(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('creatorId', new ParseUUIDPipe()) creatorId: string,
  ): Promise<void> {
    await this.service.removeCreatorFromList(user.userId, id, creatorId);
  }
}
