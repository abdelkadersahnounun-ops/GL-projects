import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";
import type { StorageProvider } from "./types";

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;

  const kind = process.env.STORAGE_PROVIDER ?? "local";

  if (kind === "s3") {
    instance = new S3StorageProvider({
      bucket: requireEnv("S3_BUCKET"),
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      publicBaseUrl: requireEnv("S3_PUBLIC_BASE_URL"),
    });
  } else {
    instance = new LocalStorageProvider(
      process.env.STORAGE_LOCAL_DIR || "./storage",
      process.env.STORAGE_PUBLIC_BASE_URL || "/api/files",
    );
  }

  return instance;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name} for STORAGE_PROVIDER=s3`);
  return v;
}

export type { StorageProvider, PutObjectInput, StorageObjectRef } from "./types";
