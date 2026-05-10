import { ApiProperty } from '@nestjs/swagger';

/**
 * US-050 — Response when a new AI Coach session is created.
 */
export class AiCoachSessionDto {
  @ApiProperty({ format: 'uuid', description: 'New AI Coach session id' })
  sessionId!: string;

  @ApiProperty({
    description: 'First assistant question (always returned in French)',
    example: "Comment te positionnes-tu en tant qu'influenceur ?",
  })
  firstMessage!: string;
}
