import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export type AdminCinValidationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export class ListCinValidationsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
  })
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
  status?: AdminCinValidationStatus;
}

export class CinValidationItemDto {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  cinNumber!: string;

  @ApiProperty({ description: 'ISO date of CIN expiry (YYYY-MM-DD)' })
  dateOfExpiry!: string;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  status!: AdminCinValidationStatus;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  submittedAt!: string;

  @ApiPropertyOptional()
  rejectionReason?: string;
}

export class PaginatedCinValidationsDto {
  @ApiProperty({ type: [CinValidationItemDto] })
  items!: CinValidationItemDto[];

  @ApiProperty({
    description: 'Next page number, or null if there are no more pages.',
    nullable: true,
    type: Number,
  })
  nextCursor!: number | null;
}

export class RejectCinValidationDto {
  @ApiProperty({ minLength: 5, description: 'Human-readable rejection reason' })
  @IsString()
  @MinLength(5)
  reason!: string;
}
