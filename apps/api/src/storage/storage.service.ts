import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UploadPayload {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
}

export interface GetObjectPayload {
  bucket: string;
  key: string;
  range?: string;
}

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const useSsl = this.configService.get<boolean>('app.minioUseSsl');
    const endpoint = `http${useSsl ? 's' : ''}://${this.configService.getOrThrow<string>('app.minioEndpoint')}:${this.configService.getOrThrow<number>('app.minioPort')}`;

    this.client = new S3Client({
      endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId:
          this.configService.getOrThrow<string>('app.minioAccessKey'),
        secretAccessKey:
          this.configService.getOrThrow<string>('app.minioSecretKey'),
      },
    });
    this.publicBaseUrl =
      this.configService.getOrThrow<string>('app.minioPublicUrl');
  }

  async upload(payload: UploadPayload) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: payload.bucket,
        Key: payload.key,
        Body: payload.body,
        ContentType: payload.contentType,
      }),
    );

    return `${this.publicBaseUrl}/${payload.bucket}/${payload.key}`;
  }

  async getSignedDownloadUrl(bucket: string, key: string, expiresIn = 60) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn },
    );
  }

  async getObject(payload: GetObjectPayload) {
    return this.client.send(
      new GetObjectCommand({
        Bucket: payload.bucket,
        Key: payload.key,
        Range: payload.range,
      }),
    );
  }

  async deleteObject(bucket: string, key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }
}
