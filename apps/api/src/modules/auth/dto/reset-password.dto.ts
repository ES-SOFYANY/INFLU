import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

import { STRONG_PASSWORD_REGEX } from './magic-link-consume.dto';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token (received by email after /auth/forgot-password)' })
  @IsString()
  @MinLength(10)
  token!: string;

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
