import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * MVP Google OAuth callback. Accepts a Google `idToken` (frontend obtained via
 * Google Sign-In SDK) and exchanges it for INFLU.ai tokens.
 *
 * NOTE — Drift vs api-contract.md `GoogleCallbackRequest`: contract specifies
 * `code` + `state` (server-side OAuth flow). Implementation uses `idToken`
 * (client-side Google Identity Services flow) per parent agent instruction
 * for simpler MVP integration. See contract-drift-report.md.
 */
export class GoogleCallbackDto {
  @ApiProperty({
    description:
      'Google ID token (JWT). In dev, accepts "mock-google-success-<email>".',
  })
  @IsString()
  @MinLength(1)
  idToken!: string;

  @ApiPropertyOptional({ description: 'CSRF state token (optional in MVP)' })
  @IsOptional()
  @IsString()
  state?: string;
}
