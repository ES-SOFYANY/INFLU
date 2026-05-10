import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** US-173 — Row of GET /business/brands/{id}/access. */
export class BrandAccessDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiProperty({ enum: ['OWNER', 'EDITOR', 'VIEWER'] })
  role!: 'OWNER' | 'EDITOR' | 'VIEWER';

  @ApiProperty({ format: 'date-time' })
  invitedAt!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  acceptedAt?: string;
}
