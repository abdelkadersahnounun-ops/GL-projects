/**
 * Runs once when the Next.js server starts. In "solo" / demo deployments
 * this boots an in-process worker that polls the VideoJob queue, so the
 * whole app works with a single `next start` and no extra process.
 *
 * For a heavier production deployment, set WORKER_INLINE=false and run
 * `npm run worker` as its own process/container instead (see
 * scripts/worker.ts) so video rendering never competes with the web
 * server for CPU.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.WORKER_INLINE === "false") return;

  const { startWorkerLoop } = await import("@/server/jobs/worker-loop");
  const interval = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 1500);
  startWorkerLoop(interval);
}
