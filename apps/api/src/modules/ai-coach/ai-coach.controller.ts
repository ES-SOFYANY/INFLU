import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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

import { AiCoachService } from './ai-coach.service';
import {
  AiCoachSessionDto,
  SendMessageDto,
  SendMessageResponseDto,
} from './dto';

@ApiTags('ai-coach')
@Controller('creator/me/ai-coach')
export class AiCoachController {
  constructor(private readonly service: AiCoachService) {}

  // ----- US-050: create new session -----
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-050] Start a new AI Coach session' })
  @ApiResponse({ status: 201, type: AiCoachSessionDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  createSession(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AiCoachSessionDto> {
    return this.service.createSession(user.userId);
  }

  // ----- US-051: send message -----
  @Post('sessions/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-051] Send a message to the AI Coach' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, type: SendMessageResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 422, description: 'EMPTY_MESSAGE' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: SendMessageDto,
  ): Promise<SendMessageResponseDto> {
    return this.service.sendMessage(user.userId, sessionId, dto);
  }

  // ----- US-051: restart -----
  @Post('sessions/:id/restart')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-051] Restart the AI Coach session' })
  @ApiResponse({ status: 200, type: AiCoachSessionDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller is not a creator' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  restartSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
  ): Promise<AiCoachSessionDto> {
    return this.service.restartSession(user.userId, sessionId);
  }
}
