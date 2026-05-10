import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Active refresh token to rotate' })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
