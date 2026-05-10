import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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
  CreateReportDto,
  FaqEntryDto,
  PaginatedReportsDto,
  SupportReportDto,
} from './dto';
import { SupportService } from './support.service';

/**
 * US-080, US-081, US-180, US-181 — `/support` endpoints accessible to ANY
 * authenticated user (CREATOR, BUSINESS, AGENCY, ADMIN). The single FAQ list
 * is shared across roles for the MVP.
 */
@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Get('faq')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[US-080,US-180] Get FAQ entries (static, English MVP)',
  })
  @ApiResponse({ status: 200, type: [FaqEntryDto] })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  getFaq(): FaqEntryDto[] {
    return this.service.getFaq();
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[US-080,US-180] List my support reports (newest first)',
  })
  @ApiResponse({ status: 200, type: PaginatedReportsDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  listReports(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedReportsDto> {
    return this.service.listMyReports(user.userId);
  }

  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[US-081,US-181] Submit a support report',
  })
  @ApiResponse({ status: 201, type: SupportReportDto })
  @ApiResponse({ status: 400, description: 'VALIDATION_FAILED' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  submitReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateReportDto,
  ): Promise<SupportReportDto> {
    return this.service.submitReport(user.userId, body);
  }
}
