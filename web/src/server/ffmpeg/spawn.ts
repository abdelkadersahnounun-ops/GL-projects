import { spawn } from "child_process";

const TIME_RE = /time=(\d+):(\d{2}):(\d{2})\.(\d{2})/;

/**
 * Runs `ffmpeg` with a raw argument list (used for filter graphs too
 * complex/dynamic to express cleanly through fluent-ffmpeg's builder) and
 * reports progress by parsing the `time=` markers ffmpeg prints to stderr.
 */
export function runFfmpegArgs(
  args: string[],
  totalDurationSec: number,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-progress", "pipe:2", ...args]);

    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      if (stderr.length > 20000) stderr = stderr.slice(-20000);

      const match = TIME_RE.exec(text);
      if (match && totalDurationSec > 0) {
        const [, hh, mm, ss, cs] = match;
        const elapsed = Number(hh) * 3600 + Number(mm) * 60 + Number(ss) + Number(cs) / 100;
        const percent = Math.max(0, Math.min(99, Math.round((elapsed / totalDurationSec) * 100)));
        onProgress?.(percent);
      }
    });

    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-2000)}`));
    });
  });
}
