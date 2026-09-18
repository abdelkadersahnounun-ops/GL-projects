import { prisma } from "@/server/db";

const lastUpdate = new Map<string, number>();
const THROTTLE_MS = 700;

/** Persists job progress at most once per THROTTLE_MS per job, so a fast
 * stream of ffmpeg progress ticks doesn't hammer the database. */
export function makeProgressReporter(jobId: string, stage: string, rangeStart: number, rangeEnd: number) {
  return async (stagePercent: number) => {
    const now = Date.now();
    const last = lastUpdate.get(jobId) ?? 0;
    if (now - last < THROTTLE_MS && stagePercent < 100) return;
    lastUpdate.set(jobId, now);

    const overall = Math.round(rangeStart + (rangeEnd - rangeStart) * (stagePercent / 100));
    await prisma.videoJob
      .update({ where: { id: jobId }, data: { stage, progress: overall } })
      .catch(() => undefined);
  };
}

export async function setJobStage(jobId: string, stage: string, progress: number) {
  await prisma.videoJob.update({ where: { id: jobId }, data: { stage, progress } });
}
