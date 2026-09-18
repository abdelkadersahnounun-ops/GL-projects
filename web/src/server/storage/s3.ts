import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import os from "os";
import path from "path";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import type { PutObjectInput, StorageObjectRef, StorageProvider } from "./types";

/**
 * Works with any S3-compatible object store: AWS S3, Cloudflare R2 or
 * Supabase Storage — only the endpoint/credentials in the environment
 * change.
 */
export class S3StorageProvider implements StorageProvider {
  readonly name = "s3";
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly tmpDir = path.join(os.tmpdir(), "avatarstudio-s3-cache");

  constructor(opts: {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle: boolean;
    publicBaseUrl: string;
  }) {
    this.bucket = opts.bucket;
    this.publicBaseUrl = opts.publicBaseUrl.replace(/\/$/, "");
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint || undefined,
      forcePathStyle: opts.forcePathStyle,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
    });
  }

  async putObject({ key, body, contentType }: PutObjectInput): Promise<StorageObjectRef> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return { key, url: this.getObjectUrl(key), sizeBytes: body.byteLength };
  }

  /** Downloads the object to a local tmp file so ffmpeg (which needs a real
   * file path) can operate on it, then returns that path. */
  async getObjectPath(key: string): Promise<string> {
    await mkdir(this.tmpDir, { recursive: true });
    const localPath = path.join(this.tmpDir, key.replace(/\//g, "__"));
    if (existsSync(localPath)) return localPath;

    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, Buffer.from(bytes));
    return localPath;
  }

  getObjectUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}
