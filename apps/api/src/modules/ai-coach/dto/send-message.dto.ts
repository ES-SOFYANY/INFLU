import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

/**
 * US-051 — Body for POST /creator/me/ai-coach/sessions/{id}/messages.
 *
 * The frontend disables the Send button when the textarea is empty
 * (AC-051-01). The backend additionally rejects whitespace-only payloads
 * with 422 EMPTY_MESSAGE, defensively.
 */
export class SendMessageDto {
  @ApiProperty({ minLength: 1, maxLength: 4000 })
  @IsString()
  @MaxLength(4000)
  content!: string;
}
