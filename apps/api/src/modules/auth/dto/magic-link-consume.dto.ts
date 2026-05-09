import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

/**
 * Strong password used for set-password / business onboarding flows.
 * Rules (US-013, US-018) :
 *  - at least 8 characters
 *  - at least one uppercase letter
 *  - at least one digit
 */
export const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export class MagicLinkConsumeDto {
  @ApiProperty({ description: 'Magic link JWT token (signed HS256)' })
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
