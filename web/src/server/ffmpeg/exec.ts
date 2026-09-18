import ffmpeg from "fluent-ffmpeg";

export interface FfmpegProgress {
  percent?: number;
  frames?: number;
  timemark?: string;
}

/** Runs an ffmpeg pipeline described via the fluent-ffmpeg builder callback. */
export function runFfmpeg(
  build: (cmd: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand,
  onProgress?: (p: FfmpegProgress) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = build(ffmpeg());
    command
      .on("progress", (p) => onProgress?.(p))
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .run();
  });
}

export function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.format.duration ?? 0);
    });
  });
}
