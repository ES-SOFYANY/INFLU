import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

import { STRONG_PASSWORD_REGEX } from '../../auth/dto/magic-link-consume.dto';

/**
 * US-071 — POST /creator/me/password/change
 */
export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({
    minLength: 8,
    description: 'New password — ≥ 8 chars, 1 uppercase, 1 digit',
  })
  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, {
    message: 'Password must be at least 8 chars with 1 uppercase and 1 digit',
  })
  newPassword!: string;
}
