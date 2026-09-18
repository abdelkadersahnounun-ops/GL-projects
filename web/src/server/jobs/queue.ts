import { prisma } from "@/server/db";

/**
 * Enqueues a video generation job for a project. Processing itself happens
 * asynchronously in the worker (see `worker-loop.ts`), so this call
 * returns immediately — the caller polls the job (or its project) for
 * progress.
 */
export async function enqueueVideoJob(projectId: string) {
  const job = await prisma.videoJob.create({
    data: { projectId, status: "PENDING", stage: "queued", progress: 0 },
  });
  await prisma.project.update({ where: { id: projectId }, data: { status: "queued" } });
  return job;
}

/**
 * Atomically claims the oldest pending job so multiple worker processes
 * (or an inline worker racing a standalone one) never both process the
 * same job: the conditional `updateMany` only succeeds for whichever
 * caller gets there first.
 */
export async function claimNextPendingJob(): Promise<string | null> {
  const candidate = await prisma.videoJob.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!candidate) return null;

  const claimed = await prisma.videoJob.updateMany({
    where: { id: candidate.id, status: "PENDING" },
    data: { status: "PROCESSING", startedAt: new Date() },
  });
  if (claimed.count === 0) return null;

  return candidate.id;
}
