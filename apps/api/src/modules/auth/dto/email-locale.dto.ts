import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class EmailLocaleDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: ['fr', 'en', 'ar'] })
  @IsOptional()
  @IsIn(['fr', 'en', 'ar'])
  locale?: 'fr' | 'en' | 'ar';
}
