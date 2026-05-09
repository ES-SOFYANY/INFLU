import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
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
import type { AuthenticatedUser } from '../../shared/auth/types';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import { AuthService } from './auth.service';
import {
  AuthSessionDto,
  EmailLocaleDto,
  GoogleCallbackDto,
  LoginDto,
  LogoutDto,
  RegisterCreatorDto,
  RoleOptionsResponseDto,
  UserPublicDto,
} from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  // ----- US-015: Role options -----
  @Get('roles')
  @ApiOperation({ summary: '[US-015] List the 4 registration roles' })
  @ApiResponse({ status: 200, type: RoleOptionsResponseDto })
  listRoles(): RoleOptionsResponseDto {
    return this.service.listRoles();
  }

  // ----- US-010: Login -----
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[US-010] Login with email + password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthSessionDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto): Promise<AuthSessionDto> {
    return this.service.login(dto);
  }

  // ----- US-011: Google OAuth callback -----
  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[US-011] Exchange Google idToken for INFLU tokens' })
  @ApiBody({ type: GoogleCallbackDto })
  @ApiResponse({ status: 200, type: AuthSessionDto })
  @ApiResponse({ status: 401, description: 'Google consent denied / invalid token' })
  googleCallback(@Body() dto: GoogleCallbackDto): Promise<AuthSessionDto> {
    return this.service.googleCallback(dto);
  }

  // ----- US-012: Forgot password -----
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: '[US-012] Request a password reset email (idempotent)' })
  @ApiBody({ type: EmailLocaleDto })
  @ApiResponse({ status: 202, description: 'Accepted (always — no email enumeration)' })
  async forgotPassword(@Body() dto: EmailLocaleDto): Promise<{ message: string }> {
    await this.service.forgotPassword(dto);
    return { message: 'If an account exists, a reset email has been sent.' };
  }

  // ----- US-014: Logout -----
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[US-014] Invalidate current session' })
  @ApiBody({ type: LogoutDto, required: false })
  @ApiResponse({ status: 204, description: 'Logged out' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogoutDto = {},
  ): Promise<void> {
    await this.service.logout(user.userId, dto.refreshToken);
  }

  // ----- US-016: Register creator (no password) -----
  @Post('register/:role')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '[US-016] Register a new user (creator step 1, no password)',
  })
  @ApiResponse({ status: 201, type: UserPublicDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Param('role') role: string,
    @Body() dto: RegisterCreatorDto,
    @Req() req: { body?: unknown },
  ): Promise<UserPublicDto> {
    const allowed = ['influencer', 'small-business', 'brand', 'agency'];
    if (!allowed.includes(role)) {
      throw new BusinessException(
        ERROR_CODES.VALIDATION_FAILED,
        `Unknown role "${role}". Allowed: ${allowed.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (role !== 'influencer') {
      throw new BusinessException(
        ERROR_CODES.VALIDATION_FAILED,
        `Role "${role}" is not implemented yet (Wave 1 covers influencer only).`,
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    void req;
    return this.service.registerCreator(dto);
  }
}
