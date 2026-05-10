import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** US-172 — POST /business/brands/link */
export class LinkBrandDto {
  @ApiProperty({ format: 'uuid', description: 'ID of an existing brand' })
  @IsUUID()
  brandId!: string;
}
