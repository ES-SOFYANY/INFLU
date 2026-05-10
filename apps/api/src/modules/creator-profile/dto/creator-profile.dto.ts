import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * US-070 — Creator account information (read).
 * `accountType` and `email` are read-only on the frontend.
 */
export class CreatorProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ description: 'Always "Content Creator" for creator accounts' })
  accountType!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  gender?: 'M' | 'F';

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: ['fr', 'en', 'ar'] })
  locale?: 'fr' | 'en' | 'ar';
}
