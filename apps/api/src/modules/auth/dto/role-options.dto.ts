import { ApiProperty } from '@nestjs/swagger';

export class RoleOptionDto {
  @ApiProperty({ enum: ['influencer', 'small-business', 'brand', 'agency'] })
  key!: 'influencer' | 'small-business' | 'brand' | 'agency';

  @ApiProperty({ description: 'CTA label for the role card' })
  cta!: string;

  @ApiProperty({ description: 'Card title' })
  title!: string;

  @ApiProperty({ description: 'Path to the registration flow' })
  registerPath!: string;
}

export class RoleOptionsResponseDto {
  @ApiProperty({ type: [RoleOptionDto] })
  roles!: RoleOptionDto[];
}
