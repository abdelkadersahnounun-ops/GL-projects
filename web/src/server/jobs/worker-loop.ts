import { claimNextPendingJob } from "./queue";
import { processJob } from "./processor";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWorkerLoopOnce(): Promise<boolean> {
  const jobId = await claimNextPendingJob();
  if (!jobId) return false;
  await processJob(jobId);
  return true;
}

/** Starts an infinite polling loop. Returns a stop function. Safe to run
 * both inline (see instrumentation.ts) and from the standalone worker
 * script — jobs are claimed atomically so the two never race. */
export function startWorkerLoop(pollIntervalMs: number): () => void {
  let stopped = false;

  (async () => {
    console.log(`[worker] started, polling every ${pollIntervalMs}ms`);
    while (!stopped) {
      try {
        const processed = await runWorkerLoopOnce();
        if (!processed) await sleep(pollIntervalMs);
      } catch (err) {
        console.error("[worker] loop error:", err);
        await sleep(pollIntervalMs);
      }
    }
  })();

  return () => {
    stopped = true;
  };
}
