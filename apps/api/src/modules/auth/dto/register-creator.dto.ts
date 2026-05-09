import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

import { IsMoroccanPhone } from '../../../shared/validators/moroccan.validators';

export class RegisterCreatorDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 2 })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ enum: ['M', 'F'] })
  @IsEnum(['M', 'F'])
  gender!: 'M' | 'F';

  @ApiProperty({ description: 'ISO-3166-1 alpha-2', minLength: 2, maxLength: 2 })
  @IsString()
  @Length(2, 2)
  country!: string;

  @ApiProperty({ pattern: '^\\+212\\d{9}$', example: '+212600000000' })
  @IsMoroccanPhone()
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Must be true (legal mentions & privacy)' })
  @IsBoolean()
  @Equals(true)
  acceptLegal!: true;

  @ApiProperty({ description: 'Must be true (>=18 confirmation)' })
  @IsBoolean()
  @Equals(true)
  ageOver18!: true;

  @ApiPropertyOptional({ enum: ['fr', 'en', 'ar'] })
  @IsOptional()
  @IsIn(['fr', 'en', 'ar'])
  locale?: 'fr' | 'en' | 'ar';
}
