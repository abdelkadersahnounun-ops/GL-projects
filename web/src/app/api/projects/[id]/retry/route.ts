import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { enqueueVideoJob } from "@/server/jobs/queue";

export async function POST(_request: Request, ctx: RouteContext<"/api/projects/[id]/retry">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  const job = await enqueueVideoJob(project.id);
  return NextResponse.json({ job }, { status: 201 });
}
