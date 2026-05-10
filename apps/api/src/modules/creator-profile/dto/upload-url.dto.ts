import { ApiProperty } from '@nestjs/swagger';

/**
 * US-074 — POST /creator/me/documents/{rib|tax-certificate}/upload-url response.
 * Mock S3 — the FE never actually uploads a file; the URL is opaque to it.
 */
export class UploadUrlDto {
  @ApiProperty({
    format: 'uri',
    description: 'Pre-signed S3 PUT URL (mock in dev/test)',
  })
  uploadUrl!: string;

  @ApiProperty({
    description: 'Object key under which the file will live in the bucket',
    example: 'creator-documents/abc123.pdf',
  })
  objectKey!: string;

  @ApiProperty({
    description: 'TTL in seconds before the upload URL expires',
    example: 900,
  })
  expiresIn!: number;
}
