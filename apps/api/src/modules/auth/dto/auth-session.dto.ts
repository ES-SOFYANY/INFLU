import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { Role } from '@my-app/shared-types';

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: 'Access token TTL in seconds' })
  expiresIn!: number;
}

export class UserPublicDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: ['CREATOR', 'BUSINESS', 'AGENCY', 'ADMIN'] })
  role!: Role;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional({ enum: ['fr', 'en', 'ar'] })
  locale?: 'fr' | 'en' | 'ar';

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  orgId?: string | null;

  @ApiProperty({
    description:
      'PENDING_PASSWORD = creator awaiting magic link to set password (US-016 → US-013); ACTIVE otherwise.',
    enum: ['ACTIVE', 'PENDING_PASSWORD', 'DISABLED'],
  })
  status!: 'ACTIVE' | 'PENDING_PASSWORD' | 'DISABLED';
}

export class AuthSessionDto {
  @ApiProperty({ type: UserPublicDto })
  user!: UserPublicDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;
}
