import { mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

import type { PutObjectInput, StorageObjectRef, StorageProvider } from "./types";

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(rootDir: string, publicBaseUrl: string) {
    this.rootDir = path.resolve(rootDir);
    this.publicBaseUrl = publicBaseUrl.replace(/\/$/, "");
  }

  private resolvePath(key: string): string {
    const safeKey = key.replace(/^\/+/, "");
    const full = path.resolve(this.rootDir, safeKey);
    if (!full.startsWith(this.rootDir)) {
      throw new Error(`Refusing to access path outside storage root: ${key}`);
    }
    return full;
  }

  async putObject({ key, body }: PutObjectInput): Promise<StorageObjectRef> {
    const full = this.resolvePath(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
    const st = await stat(full);
    return { key, url: this.getObjectUrl(key), sizeBytes: st.size };
  }

  async getObjectPath(key: string): Promise<string> {
    return this.resolvePath(key);
  }

  getObjectUrl(key: string): string {
    return `${this.publicBaseUrl}/${key.replace(/^\/+/, "")}`;
  }

  async deleteObject(key: string): Promise<void> {
    const full = this.resolvePath(key);
    if (existsSync(full)) await rm(full);
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(this.resolvePath(key));
  }

  /** Only used internally by the /api/files route to stream bytes back. */
  async readObject(key: string): Promise<Buffer> {
    return readFile(this.resolvePath(key));
  }
}
