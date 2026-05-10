import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';

export const BRAND_ACCESS_ROLES = ['OWNER', 'EDITOR', 'VIEWER'] as const;
export type BrandAccessRole = (typeof BRAND_ACCESS_ROLES)[number];

/** US-173 — POST /business/brands/{id}/access */
export class GrantBrandAccessDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: BRAND_ACCESS_ROLES })
  @IsEnum(BRAND_ACCESS_ROLES)
  role!: BrandAccessRole;
}
