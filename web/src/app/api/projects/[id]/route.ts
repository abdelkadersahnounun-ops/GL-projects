import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      avatar: true,
      background: true,
      audioAsset: true,
      jobs: { orderBy: { createdAt: "asc" } },
      videos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/projects/[id]">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
