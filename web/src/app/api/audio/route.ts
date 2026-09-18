import { mkdir, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { probeDuration } from "@/server/ffmpeg/exec";
import { prisma } from "@/server/db";
import { getStorageProvider } from "@/server/storage";

const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".webm"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await prisma.audioAsset.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ audioAssets: assets });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier audio reçu." }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase() || ".mp3";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Format non supporté (${ext}). Formats acceptés : ${ALLOWED_EXTENSIONS.join(", ")}.` },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Le fichier audio dépasse la taille maximale de 50 Mo." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const tmpDir = path.join(os.tmpdir(), "avatarstudio-uploads");
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `${randomUUID()}${ext}`);
  await writeFile(tmpPath, buffer);

  let durationSec = 0;
  try {
    durationSec = await probeDuration(tmpPath);
  } catch {
    await rm(tmpPath, { force: true });
    return NextResponse.json({ error: "Fichier audio invalide ou illisible." }, { status: 400 });
  }
  await rm(tmpPath, { force: true });

  const storage = getStorageProvider();
  const key = `audio/${session.user.id}/${randomUUID()}${ext}`;
  const ref = await storage.putObject({ key, body: buffer, contentType: file.type || "audio/mpeg" });

  const audioAsset = await prisma.audioAsset.create({
    data: {
      userId: session.user.id,
      originalName: file.name,
      storageKey: ref.key,
      url: ref.url,
      durationSec,
      mimeType: file.type || null,
      sizeBytes: ref.sizeBytes,
    },
  });

  return NextResponse.json({ audioAsset }, { status: 201 });
}
