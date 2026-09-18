import { mkdir, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { getStorageProvider } from "@/server/storage";
import { getVoiceProvider } from "@/server/voice";

const bodySchema = z.object({
  transform: z.enum(["NONE", "FEMALE", "MALE", "ROBOT", "DEEP", "CHIPMUNK"]),
});

/**
 * Runs voice conversion synchronously and returns the converted audio URL,
 * so the project wizard can offer an instant "preview the transformed
 * voice" step before the (longer) video render job is enqueued.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/audio/[id]/convert">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const audioAsset = await prisma.audioAsset.findUnique({ where: { id } });
  if (!audioAsset || audioAsset.userId !== session.user.id) {
    return NextResponse.json({ error: "Fichier audio introuvable." }, { status: 404 });
  }

  const { transform } = parsed.data;
  const storage = getStorageProvider();

  if (transform === "NONE") {
    const updated = await prisma.audioAsset.update({
      where: { id },
      data: { voiceTransform: "NONE" },
    });
    return NextResponse.json({ audioAsset: updated });
  }

  await prisma.audioAsset.update({
    where: { id },
    data: { voiceTransform: transform, processingStatus: "processing" },
  });

  const tmpDir = path.join(os.tmpdir(), "avatarstudio-voice-preview");
  await mkdir(tmpDir, { recursive: true });
  const outPath = path.join(tmpDir, `${randomUUID()}.mp3`);

  try {
    const inputPath = await storage.getObjectPath(audioAsset.storageKey);
    await getVoiceProvider().convert({ inputPath, outputPath: outPath, transform });

    const bytes = await readFile(outPath);
    const key = `processed/${audioAsset.id}.mp3`;
    const ref = await storage.putObject({ key, body: bytes, contentType: "audio/mpeg" });

    const updated = await prisma.audioAsset.update({
      where: { id },
      data: {
        voiceTransform: transform,
        processedStorageKey: ref.key,
        processedUrl: ref.url,
        processingStatus: "done",
      },
    });

    return NextResponse.json({ audioAsset: updated });
  } catch (err) {
    await prisma.audioAsset.update({ where: { id }, data: { processingStatus: "error" } }).catch(() => undefined);
    const message = err instanceof Error ? err.message : "Échec de la conversion vocale.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await rm(outPath, { force: true }).catch(() => undefined);
  }
}
