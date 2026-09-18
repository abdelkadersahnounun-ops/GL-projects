import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { enqueueVideoJob } from "@/server/jobs/queue";

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  avatarId: z.string().min(1),
  backgroundId: z.string().min(1),
  audioAssetId: z.string().min(1),
  aspectRatio: z.enum(["LANDSCAPE_16_9", "PORTRAIT_9_16", "SQUARE_1_1"]).default("LANDSCAPE_16_9"),
  resolution: z.enum(["R_720P", "R_1080P", "R_4K"]).default("R_1080P"),
  subtitles: z.boolean().default(false),
  captionText: z.string().trim().max(160).optional().nullable(),
  variantCount: z.number().int().min(1).max(4).default(1),
  avatarScale: z.number().min(0.5).max(1.6).default(1),
  avatarPositionX: z.number().min(0).max(1).default(0.5),
  avatarPositionY: z.number().min(0).max(1).default(0.85),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      avatar: true,
      background: true,
      videos: { orderBy: { createdAt: "desc" } },
      jobs: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createProjectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  const data = parsed.data;

  const [avatar, background, audioAsset] = await Promise.all([
    prisma.avatar.findUnique({ where: { id: data.avatarId } }),
    prisma.background.findUnique({ where: { id: data.backgroundId } }),
    prisma.audioAsset.findUnique({ where: { id: data.audioAssetId } }),
  ]);

  if (!avatar) return NextResponse.json({ error: "Avatar introuvable." }, { status: 404 });
  if (!background) return NextResponse.json({ error: "Arrière-plan introuvable." }, { status: 404 });
  if (!audioAsset || audioAsset.userId !== session.user.id) {
    return NextResponse.json({ error: "Fichier audio introuvable." }, { status: 404 });
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: data.name,
      avatarId: avatar.id,
      backgroundId: background.id,
      audioAssetId: audioAsset.id,
      aspectRatio: data.aspectRatio,
      resolution: data.resolution,
      subtitles: data.subtitles,
      captionText: data.captionText || null,
      variantCount: data.variantCount,
      avatarScale: data.avatarScale,
      avatarPositionX: data.avatarPositionX,
      avatarPositionY: data.avatarPositionY,
    },
  });

  for (let i = 0; i < data.variantCount; i++) {
    await enqueueVideoJob(project.id);
  }

  const full = await prisma.project.findUniqueOrThrow({
    where: { id: project.id },
    include: { avatar: true, background: true, audioAsset: true, jobs: true, videos: true },
  });

  return NextResponse.json({ project: full }, { status: 201 });
}
