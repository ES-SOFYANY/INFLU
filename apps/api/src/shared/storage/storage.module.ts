import { Global, Injectable, Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class StorageService {
  private readonly client: S3Client;

  constructor(private readonly cfg: AppConfigService) {
    this.client = new S3Client({
      region: cfg.awsRegion,
      endpoint: cfg.s3Endpoint,
      forcePathStyle: !!cfg.s3Endpoint,
    });
  }

  async signPutUrl(bucket: string, key: string, contentType: string, expiresIn = 900): Promise<string> {
    return getSignedUrl(this.client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), {
      expiresIn,
    });
  }

  async signGetUrl(bucket: string, key: string, expiresIn = 900): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
  }

  get documentsBucket(): string {
    return this.cfg.s3BucketDocuments;
  }
}

@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
