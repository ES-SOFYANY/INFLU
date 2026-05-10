import {
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
import type { AuthenticatedUser } from '../../shared/auth/types';

import {
  ListNotificationsQueryDto,
  PaginatedNotificationsDto,
} from './dto';
import { NotificationsService } from './notifications.service';

/**
 * US-204 — `/notifications` (any authenticated user).
 */
@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-204] List my notifications (paginated, newest first)' })
  @ApiResponse({ status: 200, type: PaginatedNotificationsDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<PaginatedNotificationsDto> {
    return this.service.listMyNotifications(user.userId, query);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-204] Mark a notification as read' })
  @ApiResponse({ status: 204, description: 'Marked as read' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 404, description: 'NOTIFICATION_NOT_FOUND' })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.service.markAsRead(user.userId, id);
  }
}
