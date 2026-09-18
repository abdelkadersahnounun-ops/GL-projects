/**
 * StorageProvider is the single abstraction every part of the app uses to
 * persist and serve binary assets (uploaded audio, processed audio,
 * rendered videos, thumbnails). Swapping the backing store (local disk,
 * AWS S3, Cloudflare R2, Supabase Storage) never requires touching calling
 * code — only `src/server/storage/index.ts` picks the implementation.
 */
export interface PutObjectInput {
  /** Storage key / path, e.g. "audio/2024/xyz.mp3". Callers choose the key. */
  key: string;
  /** Raw file bytes. */
  body: Buffer;
  contentType?: string;
}

export interface StorageObjectRef {
  /** The key the object was stored under. */
  key: string;
  /** A URL the browser/player can use directly to fetch the object. */
  url: string;
  sizeBytes: number;
}

export interface StorageProvider {
  readonly name: string;
  putObject(input: PutObjectInput): Promise<StorageObjectRef>;
  getObjectPath(key: string): Promise<string>;
  getObjectUrl(key: string): string;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
