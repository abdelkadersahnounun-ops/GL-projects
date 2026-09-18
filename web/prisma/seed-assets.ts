/**
 * Generates the demo avatar & background catalog images procedurally with
 * ffmpeg (gradient cards + initials for avatars, full gradient plates for
 * backgrounds), so the app has a working, self-contained media library
 * with zero external downloads or licensing concerns. Swap in real photos
 * or a real AvatarProvider for production use.
 */
import { mkdir, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

import { runFfmpegArgs } from "../src/server/ffmpeg/spawn";
import type { StorageProvider } from "../src/server/storage/types";

const FONT = process.env.VIDEO_CAPTION_FONT || "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const TMP_DIR = path.join(os.tmpdir(), "avatarstudio-seed-assets");

async function tmpFile(ext: string): Promise<string> {
  await mkdir(TMP_DIR, { recursive: true });
  return path.join(TMP_DIR, `${randomUUID()}${ext}`);
}

async function run(args: string[]) {
  await runFfmpegArgs(args, 0);
}

export interface AvatarImageSpec {
  slug: string;
  initials: string;
  colorFrom: string;
  colorTo: string;
}

/** Generates a circular gradient "avatar card" with initials (RGBA PNG,
 * ready to be composited into rendered videos and used as a thumbnail). */
export async function generateAvatarImage(storage: StorageProvider, spec: AvatarImageSpec): Promise<string> {
  const size = 640;
  const gradientPath = await tmpFile(".png");
  const finalPath = await tmpFile(".png");

  await run([
    "-f", "lavfi",
    "-i", `gradients=size=${size}x${size}:c0=${spec.colorFrom}:c1=${spec.colorTo}:x0=0:y0=0:x1=${size}:y1=${size}`,
    "-frames:v", "1",
    "-vf", "format=rgba",
    gradientPath,
  ]);

  const r = size / 2;
  await run([
    "-i", gradientPath,
    "-vf",
    [
      `geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte((X-${r})*(X-${r})+(Y-${r})*(Y-${r}),${r}*${r}),255,0)'`,
      `drawtext=fontfile=${FONT}:text='${spec.initials}':fontcolor=white@0.95:fontsize=${Math.round(size * 0.34)}:` +
        `x=(w-text_w)/2:y=(h-text_h)/2-${Math.round(size * 0.02)}:shadowcolor=black@0.35:shadowx=2:shadowy=2`,
    ].join(","),
    finalPath,
  ]);

  const bytes = await readFile(finalPath);
  const key = `demo/avatars/${spec.slug}.png`;
  const ref = await storage.putObject({ key, body: bytes, contentType: "image/png" });

  await Promise.all([rm(gradientPath, { force: true }), rm(finalPath, { force: true })]);
  return ref.key;
}

export interface BackgroundImageSpec {
  slug: string;
  colorFrom: string;
  colorTo: string;
}

/** Generates a 1920x1080 gradient plate plus a small thumbnail. Returns
 * the storage keys for both. */
export async function generateBackgroundImage(
  storage: StorageProvider,
  spec: BackgroundImageSpec,
): Promise<{ assetKey: string; thumbnailKey: string }> {
  const fullPath = await tmpFile(".jpg");
  const thumbPath = await tmpFile(".jpg");

  await run([
    "-f", "lavfi",
    "-i", `gradients=size=1920x1080:c0=${spec.colorFrom}:c1=${spec.colorTo}:x0=0:y0=0:x1=1920:y1=1080`,
    "-frames:v", "1",
    "-q:v", "3",
    fullPath,
  ]);
  await run(["-i", fullPath, "-vf", "scale=480:270", "-q:v", "4", thumbPath]);

  const [fullBytes, thumbBytes] = await Promise.all([readFile(fullPath), readFile(thumbPath)]);
  const assetRef = await storage.putObject({
    key: `demo/backgrounds/${spec.slug}.jpg`,
    body: fullBytes,
    contentType: "image/jpeg",
  });
  const thumbRef = await storage.putObject({
    key: `demo/backgrounds/${spec.slug}-thumb.jpg`,
    body: thumbBytes,
    contentType: "image/jpeg",
  });

  await Promise.all([rm(fullPath, { force: true }), rm(thumbPath, { force: true })]);
  return { assetKey: assetRef.key, thumbnailKey: thumbRef.key };
}

/** For color-kind backgrounds we still generate a small solid swatch so
 * the gallery has a thumbnail to show. */
export async function generateColorSwatch(storage: StorageProvider, slug: string, color: string): Promise<string> {
  const outPath = await tmpFile(".jpg");
  await run(["-f", "lavfi", "-i", `color=c=${color}:s=480x270`, "-frames:v", "1", "-q:v", "4", outPath]);
  const bytes = await readFile(outPath);
  const ref = await storage.putObject({
    key: `demo/backgrounds/${slug}-thumb.jpg`,
    body: bytes,
    contentType: "image/jpeg",
  });
  await rm(outPath, { force: true });
  return ref.key;
}
