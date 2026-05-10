import {
  Body,
  Controller,
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

import { AiCampaignService } from './ai-campaign.service';
import {
  AiCampaignMessageResponseDto,
  CampaignDto,
  ListAiCampaignsQueryDto,
  PaginatedCampaignsDto,
  SendCampaignMessageDto,
  StartAiCampaignSessionResponseDto,
  UpdateCampaignStatusDto,
} from './dto';

@ApiTags('ai-campaign')
@Controller('business')
export class AiCampaignController {
  constructor(private readonly service: AiCampaignService) {}

  // ----- US-110: Start AI Campaign chat session -----
  @Post('ai-campaign/sessions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-110] Start a new AI Campaign chat session' })
  @ApiResponse({ status: 201, type: StartAiCampaignSessionResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  startSession(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StartAiCampaignSessionResponseDto> {
    return this.service.startSession(user.userId);
  }

  // ----- US-110: Send chat message -----
  @Post('ai-campaign/sessions/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[US-110] Send a chat message (content and/or selectedScopes). Creates a Campaign DRAFT when the AI marks the brief as ready.',
  })
  @ApiBody({ type: SendCampaignMessageDto })
  @ApiResponse({ status: 201, type: AiCampaignMessageResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 422, description: 'EMPTY_MESSAGE' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: SendCampaignMessageDto,
  ): Promise<AiCampaignMessageResponseDto> {
    return this.service.sendMessage(user.userId, sessionId, dto);
  }

  // ----- US-111: List campaigns -----
  @Get('ai-campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-111] List my AI campaigns (AI Manager)' })
  @ApiResponse({ status: 200, type: PaginatedCampaignsDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not BUSINESS/AGENCY' })
  listCampaigns(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAiCampaignsQueryDto,
  ): Promise<PaginatedCampaignsDto> {
    return this.service.listCampaigns(user.userId, query);
  }

  // ----- US-111: Get campaign detail -----
  @Get('ai-campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-111] Get one of my AI campaigns' })
  @ApiResponse({ status: 200, type: CampaignDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  getCampaign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CampaignDto> {
    return this.service.getCampaign(user.userId, id);
  }

  // ----- US-111: Update status -----
  @Patch('ai-campaigns/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[US-111] Transition campaign status (DRAFT→ACTIVE, ACTIVE↔ON_HOLD, *→COMPLETED)',
  })
  @ApiResponse({ status: 200, type: CampaignDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not the owner' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 409, description: 'INVALID_TRANSITION' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCampaignStatusDto,
  ): Promise<CampaignDto> {
    return this.service.updateCampaignStatus(user.userId, id, dto);
  }
}
