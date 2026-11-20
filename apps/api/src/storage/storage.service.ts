import { Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { AppConfigService } from '../config/app-config.module';
import { ErrorCode, errors } from '../common/errors';

export interface StoredObject {
  key: string;
  url: string;
  contentType: string;
}

/**
 * Media storage. Local disk is the Milestone 1 driver (dev machines and a
 * Railway volume); the S3 path is wired but only activates when configured and
 * `@aws-sdk/client-s3` is installed.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger('Storage');

  constructor(private readonly config: AppConfigService) {}

  get driver(): 'local' | 's3' {
    return this.config.env.STORAGE_DRIVER;
  }

  publicUrl(key: string): string {
    if (this.driver === 's3') {
      const base = this.config.env.S3_PUBLIC_BASE_URL ?? this.config.env.STORAGE_PUBLIC_BASE_URL;
      if (!base) {
        return key;
      }
      return `${base.replace(/\/$/, '')}/${key}`;
    }

    const base =
      this.config.env.STORAGE_PUBLIC_BASE_URL ?? `${this.config.apiBaseUrl}/files`;
    return `${base.replace(/\/$/, '')}/${key}`;
  }

  async save(key: string, body: Buffer, contentType: string): Promise<StoredObject> {
    this.assertSafeKey(key);

    if (this.driver === 's3') {
      await this.saveToS3(key, body, contentType);
    } else {
      const path = this.localPath(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, body);
    }

    return { key, url: this.publicUrl(key), contentType };
  }

  async read(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    this.assertSafeKey(key);

    if (this.driver !== 'local') {
      return null;
    }

    try {
      const body = await readFile(this.localPath(key));
      return { body, contentType: contentTypeFor(key) };
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    this.assertSafeKey(key);

    if (this.driver === 's3') {
      await this.removeFromS3(key);
      return;
    }

    try {
      await unlink(this.localPath(key));
    } catch {
      // Missing files are not an error: the database row is the source of truth.
    }
  }

  private localPath(key: string): string {
    const root = isAbsolute(this.config.env.STORAGE_LOCAL_DIR)
      ? this.config.env.STORAGE_LOCAL_DIR
      : join(process.cwd(), this.config.env.STORAGE_LOCAL_DIR);
    const path = resolve(root, key);
    if (!path.startsWith(resolve(root))) {
      throw errors.validation('Invalid file path');
    }
    return path;
  }

  private assertSafeKey(key: string): void {
    if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(key)) {
      throw errors.validation('Invalid file key', { code: ErrorCode.UPLOAD_FAILED });
    }
  }

  private async saveToS3(key: string, body: Buffer, contentType: string): Promise<void> {
    const s3 = await this.loadS3Client();
    await s3.send(
      new s3.PutObjectCommand({
        Bucket: this.config.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  private async removeFromS3(key: string): Promise<void> {
    const s3 = await this.loadS3Client();
    await s3.send(
      new s3.DeleteObjectCommand({ Bucket: this.config.env.S3_BUCKET, Key: key }),
    );
  }

  private async loadS3Client(): Promise<{
    send: (command: unknown) => Promise<unknown>;
    PutObjectCommand: new (input: Record<string, unknown>) => unknown;
    DeleteObjectCommand: new (input: Record<string, unknown>) => unknown;
  }> {
    try {
      const moduleName = '@aws-sdk/client-s3';
      const sdk = (await import(moduleName)) as unknown as {
        S3Client: new (options: Record<string, unknown>) => { send: (c: unknown) => Promise<unknown> };
        PutObjectCommand: new (input: Record<string, unknown>) => unknown;
        DeleteObjectCommand: new (input: Record<string, unknown>) => unknown;
      };

      const client = new sdk.S3Client({
        region: this.config.env.S3_REGION ?? 'auto',
        endpoint: this.config.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: this.config.env.S3_ACCESS_KEY_ID,
          secretAccessKey: this.config.env.S3_SECRET_ACCESS_KEY,
        },
      });

      return {
        send: (command) => client.send(command),
        PutObjectCommand: sdk.PutObjectCommand,
        DeleteObjectCommand: sdk.DeleteObjectCommand,
      };
    } catch (error) {
      this.logger.error('S3 storage is selected but @aws-sdk/client-s3 is not installed');
      throw errors.validation(
        'S3 storage is not available. Install @aws-sdk/client-s3 or set STORAGE_DRIVER=local.',
        { cause: error instanceof Error ? error.message : String(error) },
      );
    }
  }
}

const MIME_BY_EXTENSION: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

function contentTypeFor(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
}
