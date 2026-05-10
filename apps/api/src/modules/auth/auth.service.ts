import { createHash, randomBytes } from 'crypto';

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AppConfigService } from '../../config/app-config.service';
import { AuditService } from '../../shared/audit/audit.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import { AuthRepository, type BusinessLegalRecord, type UserRecord } from './auth.repository';
import type {
  AuthSessionDto,
  EmailLocaleDto,
  GoogleCallbackDto,
  LoginDto,
  MagicLinkConsumeDto,
  MagicLinkRequestDto,
  OnboardBusinessDto,
  RefreshDto,
  RegisterCreatorDto,
  ResetPasswordDto,
  RoleOptionsResponseDto,
  UserPublicDto,
} from './dto';
import { AuthTokensDto } from './dto/auth-session.dto';
import { v4 as uuidv4 } from './uuid';

import type { Role } from '@my-app/shared-types';

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAGIC_LINK_TTL_SECONDS = 30 * 60; // US-013 — 30 min

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly cfg: AppConfigService,
    private readonly audit: AuditService,
  ) {}

  // ============ US-010: Login ============

  async login(dto: LoginDto): Promise<AuthSessionDto> {
    const user = await this.repo.findByEmail(dto.email.toLowerCase());
    if (!user || !user.passwordHash) {
      throw new BusinessException(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.repo.incrementFailedLogin(user.id);
      throw new BusinessException(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user.status === 'DISABLED' || user.status === 'DELETED_PENDING_PURGE') {
      throw new BusinessException(
        ERROR_CODES.UNAUTHORIZED,
        'Account is not active',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.repo.touchLastLogin(user.id, new Date().toISOString());
    return this.issueSession(user);
  }

  // ============ US-011: Google OAuth ============

  async googleCallback(dto: GoogleCallbackDto): Promise<AuthSessionDto> {
    const idToken = dto.idToken;
    const isNonProd = this.cfg.nodeEnv !== 'production';

    if (isNonProd && idToken === 'mock-google-denied') {
      throw new BusinessException(
        ERROR_CODES.UNAUTHORIZED,
        'Google consent was denied',
        HttpStatus.UNAUTHORIZED,
      );
    }

    let googleEmail: string | null = null;
    let googleSub: string | null = null;
    let googleName: string | null = null;

    if (isNonProd && idToken.startsWith('mock-google-success-')) {
      googleEmail = idToken.replace('mock-google-success-', '').toLowerCase();
      googleSub = `mock-sub-${createHash('sha256')
        .update(googleEmail)
        .digest('hex')
        .slice(0, 16)}`;
      googleName = googleEmail.split('@')[0];
    } else {
      throw new BusinessException(
        ERROR_CODES.TOKEN_INVALID,
        'Google idToken validation is not configured',
        HttpStatus.UNAUTHORIZED,
      );
    }

    let user = await this.repo.findByEmail(googleEmail);
    if (!user) {
      const now = new Date().toISOString();
      const id = uuidv4();
      user = {
        id,
        email: googleEmail,
        emailVerified: true,
        role: 'CREATOR',
        accountType: 'creator',
        status: 'ACTIVE',
        fullName: googleName ?? googleEmail,
        country: 'MA',
        locale: 'fr',
        acceptedLegalAt: now,
        ageOver18: true,
        googleId: googleSub ?? undefined,
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
      };
      await this.repo.createUser(user);
      await this.audit.append({
        actorUserId: user.id,
        action: 'AUTH_GOOGLE_SIGNUP',
        resource: `USER#${user.id}`,
        details: { email: googleEmail },
      });
    }
    await this.repo.touchLastLogin(user.id, new Date().toISOString());
    return this.issueSession(user);
  }

  // ============ US-012: Forgot password ============

  async forgotPassword(dto: EmailLocaleDto): Promise<void> {
    const email = dto.email.toLowerCase();
    const user = await this.repo.findByEmail(email);
    if (user) {
      const issued = await this.issueResetPasswordToken(
        user.id,
        dto.locale ?? user.locale,
      );
      await this.audit.append({
        actorUserId: user.id,
        action: 'AUTH_FORGOT_PASSWORD_REQUEST',
        resource: `USER#${user.id}`,
        details: { email, locale: dto.locale ?? user.locale },
      });
      this.logger.log(
        `[email-stub] would send reset link for ${email} (token=${issued.token.slice(0, 6)}…)`,
      );
    } else {
      this.logger.log(`[email-stub] forgot-password requested for unknown email ${email}`);
    }
  }

  /**
   * US-012 — Internal helper: emits an opaque reset-password token (32 random
   * bytes hex) and persists its sha256 hash in `influ_sessions` with TTL 30 min
   * and kind=RESET_PASSWORD. Public so unit tests can fetch the actual token
   * without parsing logs.
   */
  async issueResetPasswordToken(
    userId: string,
    locale: 'fr' | 'en' | 'ar',
  ): Promise<{ token: string; expiresAt: number }> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = sha256(token);
    const nowMs = Date.now();
    const expiresAt = Math.floor((nowMs + 30 * 60 * 1000) / 1000);
    await this.repo.putSession({
      tokenHash,
      kind: 'RESET_PASSWORD',
      userId,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt,
      payload: { locale },
    });
    return { token, expiresAt };
  }

  // ============ Reset password (consume token from forgot-password) ============

  async resetPassword(dto: ResetPasswordDto): Promise<AuthSessionDto> {
    const tokenHash = sha256(dto.token);
    const session = await this.repo.getSession(tokenHash);
    if (!session || session.kind !== 'RESET_PASSWORD' || !session.userId) {
      throw new BusinessException(
        ERROR_CODES.INVALID_RESET_TOKEN,
        'Reset token is invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (session.usedAt) {
      throw new BusinessException(
        ERROR_CODES.INVALID_RESET_TOKEN,
        'Reset token has already been used.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (Date.now() / 1000 > session.expiresAt) {
      throw new BusinessException(
        ERROR_CODES.INVALID_RESET_TOKEN,
        'Reset token has expired.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.repo.findById(session.userId);
    if (!user) {
      throw new BusinessException(
        ERROR_CODES.INVALID_RESET_TOKEN,
        'Reset token is invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      await this.repo.markSessionUsed(tokenHash, new Date().toISOString());
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'ConditionalCheckFailedException') {
        throw new BusinessException(
          ERROR_CODES.INVALID_RESET_TOKEN,
          'Reset token has already been used.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw err;
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.repo.setPasswordAndActivate(user.id, passwordHash);
    user.passwordHash = passwordHash;
    user.status = 'ACTIVE';
    user.emailVerified = true;

    await this.audit.append({
      actorUserId: user.id,
      action: 'AUTH_PASSWORD_RESET',
      resource: `USER#${user.id}`,
    });
    return this.issueSession(user);
  }

  // ============ Refresh token rotation ============

  async refresh(dto: RefreshDto): Promise<AuthTokensDto> {
    const tokenHash = sha256(dto.refreshToken);
    const session = await this.repo.getSession(tokenHash);
    if (!session || session.kind !== 'REFRESH' || !session.userId) {
      throw new BusinessException(
        ERROR_CODES.INVALID_REFRESH_TOKEN,
        'Refresh token is invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (session.usedAt) {
      throw new BusinessException(
        ERROR_CODES.INVALID_REFRESH_TOKEN,
        'Refresh token has already been used (revoked).',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (Date.now() / 1000 > session.expiresAt) {
      throw new BusinessException(
        ERROR_CODES.INVALID_REFRESH_TOKEN,
        'Refresh token has expired.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.repo.findById(session.userId);
    if (!user) {
      throw new BusinessException(
        ERROR_CODES.INVALID_REFRESH_TOKEN,
        'Refresh token is invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Atomically revoke the current refresh token (single-use rotation).
    try {
      await this.repo.markSessionUsed(tokenHash, new Date().toISOString());
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'ConditionalCheckFailedException') {
        throw new BusinessException(
          ERROR_CODES.INVALID_REFRESH_TOKEN,
          'Refresh token has already been used (revoked).',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw err;
    }

    const session2 = await this.issueSession(user);
    await this.audit.append({
      actorUserId: user.id,
      action: 'AUTH_REFRESH_ROTATE',
      resource: `USER#${user.id}`,
    });
    return session2.tokens;
  }

  // ============ US-014: Logout ============

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.repo.deleteSession(sha256(refreshToken));
    }
    await this.audit.append({
      actorUserId: userId,
      action: 'AUTH_LOGOUT',
      resource: `USER#${userId}`,
    });
  }

  // ============ US-015: Role options ============

  listRoles(): RoleOptionsResponseDto {
    return {
      roles: [
        {
          key: 'influencer',
          title: "I'm an Influencer",
          cta: 'Get started as an Influencer',
          registerPath: '/auth/register/influencer',
        },
        {
          key: 'small-business',
          title: "We're a Small Business",
          cta: 'Get started as a Small Business',
          registerPath: '/auth/register/small-business',
        },
        {
          key: 'brand',
          title: 'We are a Brand',
          cta: 'Get started as a Brand',
          registerPath: '/auth/register/brand',
        },
        {
          key: 'agency',
          title: 'We are an Agency',
          cta: 'Get started as an Agency',
          registerPath: '/auth/register/agency',
        },
      ],
    };
  }

  // ============ US-016: Register creator (no password) ============

  async registerCreator(dto: RegisterCreatorDto): Promise<UserPublicDto> {
    const email = dto.email.toLowerCase();
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      throw new BusinessException(
        ERROR_CODES.EMAIL_ALREADY_USED,
        'Email already registered',
        HttpStatus.CONFLICT,
      );
    }
    const now = new Date().toISOString();
    const id = uuidv4();
    const user: UserRecord = {
      id,
      email,
      emailVerified: false,
      role: 'CREATOR',
      accountType: 'creator',
      status: 'PENDING_PASSWORD',
      fullName: dto.fullName,
      gender: dto.gender,
      country: dto.country.toUpperCase(),
      city: dto.city,
      address: dto.address,
      phone: dto.phone,
      locale: dto.locale ?? 'fr',
      acceptedLegalAt: now,
      ageOver18: dto.ageOver18,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.repo.createUser(user);
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'TransactionCanceledException') {
        throw new BusinessException(
          ERROR_CODES.EMAIL_ALREADY_USED,
          'Email already registered',
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }

    const magic = await this.issueMagicLink(user.id, dto.locale ?? 'fr', 'CREATOR_INITIAL_PASSWORD');
    await this.audit.append({
      actorUserId: user.id,
      action: 'AUTH_REGISTER_CREATOR',
      resource: `USER#${user.id}`,
      details: {
        email,
        magicLinkIssued: true,
        magicTokenPreview: magic.token.slice(0, 6),
      },
    });
    this.logger.log(
      `[email-stub] would send magic link to ${email} (token=${magic.token.slice(0, 6)}…)`,
    );

    return this.toPublic(user);
  }

  // ============ US-013: Magic link ============

  /**
   * Internal helper — issues a JWT magic-link token (HS256, 30 min) and
   * persists a single-use session row in `influ_sessions`.
   * Public so unit tests can fetch the actual token without parsing logs.
   */
  async issueMagicLink(
    userId: string,
    locale: 'fr' | 'en' | 'ar',
    reason: string,
  ): Promise<{ token: string; expiresAt: number }> {
    const token = await this.jwt.signAsync(
      { sub: userId, kind: 'magic', reason },
      { expiresIn: MAGIC_LINK_TTL_SECONDS },
    );
    const tokenHash = sha256(token);
    const nowMs = Date.now();
    const expiresAt = Math.floor((nowMs + MAGIC_LINK_TTL_SECONDS * 1000) / 1000);
    await this.repo.putSession({
      tokenHash,
      kind: 'MAGIC_LINK',
      userId,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt,
      payload: { reason, locale },
    });
    return { token, expiresAt };
  }

  async requestMagicLink(dto: MagicLinkRequestDto): Promise<void> {
    const email = dto.email.toLowerCase();
    const user = await this.repo.findByEmail(email);
    if (user) {
      const magic = await this.issueMagicLink(
        user.id,
        dto.locale ?? user.locale,
        'MAGIC_LINK_REQUEST',
      );
      await this.audit.append({
        actorUserId: user.id,
        action: 'AUTH_MAGIC_LINK_REQUEST',
        resource: `USER#${user.id}`,
        details: { email, tokenPreview: magic.token.slice(0, 6) },
      });
      this.logger.log(
        `[email-stub] would send magic link to ${email} (token=${magic.token.slice(0, 6)}…)`,
      );
    } else {
      // No-enumeration: silently succeed.
      this.logger.log(`[email-stub] magic-link requested for unknown email ${email}`);
    }
  }

  async consumeMagicLink(dto: MagicLinkConsumeDto): Promise<AuthSessionDto> {
    let payload: { sub: string; kind?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; kind?: string }>(dto.token);
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'TokenExpiredError') {
        throw new BusinessException(
          ERROR_CODES.LINK_EXPIRED,
          'Magic link has expired. Please request a new one.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new BusinessException(
        ERROR_CODES.LINK_INVALID,
        'Magic link is invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (payload.kind !== 'magic') {
      throw new BusinessException(
        ERROR_CODES.LINK_INVALID,
        'Magic link is invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokenHash = sha256(dto.token);
    const session = await this.repo.getSession(tokenHash);
    if (!session || session.kind !== 'MAGIC_LINK' || session.userId !== payload.sub) {
      throw new BusinessException(
        ERROR_CODES.LINK_INVALID,
        'Magic link is invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (session.usedAt) {
      throw new BusinessException(
        ERROR_CODES.LINK_ALREADY_USED,
        'Magic link has already been used.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (Date.now() / 1000 > session.expiresAt) {
      throw new BusinessException(
        ERROR_CODES.LINK_EXPIRED,
        'Magic link has expired. Please request a new one.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.repo.findById(payload.sub);
    if (!user) {
      throw new BusinessException(
        ERROR_CODES.LINK_INVALID,
        'Magic link is invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      await this.repo.markSessionUsed(tokenHash, new Date().toISOString());
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === 'ConditionalCheckFailedException') {
        throw new BusinessException(
          ERROR_CODES.LINK_ALREADY_USED,
          'Magic link has already been used.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw err;
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.repo.setPasswordAndActivate(user.id, passwordHash);

    user.passwordHash = passwordHash;
    user.status = 'ACTIVE';
    user.emailVerified = true;

    await this.audit.append({
      actorUserId: user.id,
      action: 'AUTH_MAGIC_LINK_CONSUME',
      resource: `USER#${user.id}`,
    });
    return this.issueSession(user);
  }

  // ============ US-018: Business onboarding ============

  async onboardBusiness(dto: OnboardBusinessDto): Promise<AuthSessionDto> {
    const email = dto.email.toLowerCase();
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      throw new BusinessException(
        ERROR_CODES.EMAIL_ALREADY_USED,
        'Email already registered',
        HttpStatus.CONFLICT,
      );
    }

    const role: Role = dto.accountType === 'agency' ? 'AGENCY' : 'BUSINESS';
    const accountType = dto.accountType;

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const now = new Date().toISOString();
    const id = uuidv4();
    const user: UserRecord = {
      id,
      email,
      emailVerified: false,
      passwordHash,
      role,
      accountType,
      status: 'ACTIVE',
      fullName: dto.fullName,
      gender: dto.gender,
      country: (dto.country ?? 'MA').toUpperCase(),
      address: dto.address,
      phone: dto.phone,
      locale: dto.locale ?? 'fr',
      acceptedLegalAt: now,
      ageOver18: true,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    const legal: BusinessLegalRecord = {
      userId: id,
      juridicalForm: dto.juridicalForm,
      ice: dto.ice,
      companyName: dto.companyName,
      companyAddress: dto.companyAddress,
      if: dto.if,
      rc: dto.rc,
      tva: dto.tva,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.repo.createBusinessAccount(user, legal);
    } catch (err) {
      const e = err as { name?: string; CancellationReasons?: { Code?: string }[] };
      if (e.name === 'TransactionCanceledException') {
        const reasons = e.CancellationReasons ?? [];
        // Order in createBusinessAccount: [emailSentinel, iceSentinel, user, legal]
        const emailFailed = reasons[0]?.Code === 'ConditionalCheckFailed';
        const iceFailed = reasons[1]?.Code === 'ConditionalCheckFailed';
        if (iceFailed && !emailFailed) {
          throw new BusinessException(
            ERROR_CODES.ICE_ALREADY_USED,
            'ICE already registered',
            HttpStatus.CONFLICT,
          );
        }
        if (emailFailed) {
          throw new BusinessException(
            ERROR_CODES.EMAIL_ALREADY_USED,
            'Email already registered',
            HttpStatus.CONFLICT,
          );
        }
        // Fallback if reasons are not exposed by DynamoDB Local
        const conflictUser = await this.repo.findByEmail(email);
        if (conflictUser) {
          throw new BusinessException(
            ERROR_CODES.EMAIL_ALREADY_USED,
            'Email already registered',
            HttpStatus.CONFLICT,
          );
        }
        throw new BusinessException(
          ERROR_CODES.ICE_ALREADY_USED,
          'ICE already registered',
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }

    await this.audit.append({
      actorUserId: user.id,
      action: 'AUTH_ONBOARD_BUSINESS',
      resource: `USER#${user.id}`,
      details: { email, accountType, role, ice: dto.ice },
    });
    await this.repo.touchLastLogin(user.id, new Date().toISOString());
    return this.issueSession(user);
  }

  // ============ Helpers ============

  async issueSession(user: UserRecord): Promise<AuthSessionDto> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: this.cfg.jwtAccessTtl },
    );
    const refreshToken = randomBytes(48).toString('hex');
    const refreshHash = sha256(refreshToken);
    const now = Date.now();
    await this.repo.putSession({
      tokenHash: refreshHash,
      kind: 'REFRESH',
      userId: user.id,
      createdAt: new Date(now).toISOString(),
      expiresAt: Math.floor((now + REFRESH_TTL_SECONDS * 1000) / 1000),
    });
    return {
      user: this.toPublic(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TTL_SECONDS,
      },
    };
  }

  private toPublic(user: UserRecord): UserPublicDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.fullName,
      locale: user.locale,
      orgId: null,
      status:
        user.status === 'DELETED_PENDING_PURGE'
          ? 'DISABLED'
          : (user.status as 'ACTIVE' | 'PENDING_PASSWORD' | 'DISABLED'),
    };
  }
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
