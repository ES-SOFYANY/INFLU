import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({ description: 'Refresh token to invalidate (rotation)' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
