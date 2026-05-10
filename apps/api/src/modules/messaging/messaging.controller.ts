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

import {
  ListConversationsQueryDto,
  ListMessagesQueryDto,
  MessageDto,
  PaginatedConversationsDto,
  PaginatedMessagesDto,
  PostMessageDto,
} from './dto';
import { MessagingService } from './messaging.service';

@ApiTags('messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly service: MessagingService) {}

  /**
   * US-060 / US-061 / US-150 — List conversations for the current user
   * (CREATOR or BUSINESS|AGENCY). Returns `{items: [], total: 0}` when empty.
   */
  @Get('conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-060/US-061/US-150] List my conversations' })
  @ApiResponse({ status: 200, type: PaginatedConversationsDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller has insufficient role' })
  listConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListConversationsQueryDto,
  ): Promise<PaginatedConversationsDto> {
    return this.service.listMyConversations(user.userId, query);
  }

  /**
   * US-060 — List messages of a conversation chronologically.
   */
  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-060] List messages of a conversation' })
  @ApiResponse({ status: 200, type: PaginatedMessagesDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN — not a participant' })
  @ApiResponse({ status: 404, description: 'CONVERSATION_NOT_FOUND' })
  listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<PaginatedMessagesDto> {
    return this.service.listMessages(user.userId, id, query);
  }

  /**
   * US-060 — Post a new message in a conversation.
   */
  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'BUSINESS', 'AGENCY')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-060] Post a message in a conversation' })
  @ApiBody({ type: PostMessageDto })
  @ApiResponse({ status: 201, type: MessageDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'FORBIDDEN — not a participant' })
  @ApiResponse({ status: 404, description: 'CONVERSATION_NOT_FOUND' })
  @ApiResponse({ status: 422, description: 'EMPTY_MESSAGE' })
  postMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PostMessageDto,
  ): Promise<MessageDto> {
    return this.service.postMessage(user.userId, id, dto);
  }
}
