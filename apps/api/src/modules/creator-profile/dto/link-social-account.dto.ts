import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LinkSocialAccountDto {
  @ApiProperty({
    description:
      'OAuth code returned by the social provider. In dev/test, use `mock-success-<handle>`.',
    example: 'mock-success-janedoe',
  })
  @IsString()
  @MinLength(3)
  oauthCode!: string;
}
