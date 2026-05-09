import { createHash, randomBytes } from 'crypto';

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AppConfigService } from '../../config/app-config.service';
import { AuditService } from '../../shared/audit/audit.module';
import { BusinessException } from '../../shared/errors/business.exception';
import { ERROR_CODES } from '../../shared/errors/error-codes';

import { AuthRepository, type UserRecord } from './auth.repository';
import type {
  AuthSessionDto,
  EmailLocaleDto,
  GoogleCallbackDto,
  LoginDto,
  RegisterCreatorDto,
  RoleOptionsResponseDto,
  UserPublicDto,
} from './dto';
import { v4 as uuidv4 } from './uuid';

import type { Role } from '@my-app/shared-types';

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

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
      const token = randomBytes(32).toString('hex');
      const tokenHash = sha256(token);
      const now = Date.now();
      await this.repo.putSession({
        tokenHash,
        kind: 'RESET_PASSWORD',
        userId: user.id,
        createdAt: new Date(now).toISOString(),
        expiresAt: Math.floor((now + 60 * 60 * 1000) / 1000),
        payload: { locale: dto.locale ?? user.locale },
      });
      await this.audit.append({
        actorUserId: user.id,
        action: 'AUTH_FORGOT_PASSWORD_REQUEST',
        resource: `USER#${user.id}`,
        details: { email, locale: dto.locale ?? user.locale },
      });
      this.logger.log(
        `[email-stub] would send reset link for ${email} (token=${token.slice(0, 6)}…)`,
      );
    } else {
      this.logger.log(`[email-stub] forgot-password requested for unknown email ${email}`);
    }
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

    const magicToken = randomBytes(32).toString('hex');
    const magicHash = sha256(magicToken);
    const nowMs = Date.now();
    await this.repo.putSession({
      tokenHash: magicHash,
      kind: 'MAGIC_LINK',
      userId: user.id,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: Math.floor((nowMs + 60 * 60 * 1000) / 1000),
      payload: { reason: 'CREATOR_INITIAL_PASSWORD' },
    });
    await this.audit.append({
      actorUserId: user.id,
      action: 'AUTH_REGISTER_CREATOR',
      resource: `USER#${user.id}`,
      details: {
        email,
        magicLinkIssued: true,
        magicTokenPreview: magicToken.slice(0, 6),
      },
    });
    this.logger.log(
      `[email-stub] would send magic link to ${email} (token=${magicToken.slice(0, 6)}…)`,
    );

    return this.toPublic(user);
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
