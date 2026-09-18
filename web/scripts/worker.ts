/**
 * Standalone video-rendering worker.
 *
 * Run with `npm run worker`. Intended for production deployments where the
 * web server and the (CPU-heavy, ffmpeg-based) rendering worker should be
 * separate processes/containers — set WORKER_INLINE=false on the web
 * server in that case so it stops also polling the queue itself.
 */
import "dotenv/config";

import { startWorkerLoop } from "../src/server/jobs/worker-loop";

const interval = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 1500);
startWorkerLoop(interval);

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
