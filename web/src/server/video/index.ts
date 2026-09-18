import { FfmpegVideoProvider } from "./ffmpeg-provider";
import type { VideoProvider } from "./types";

let instance: VideoProvider | null = null;

export function getVideoProvider(): VideoProvider {
  if (instance) return instance;
  const kind = process.env.VIDEO_PROVIDER ?? "ffmpeg";
  switch (kind) {
    case "ffmpeg":
    default:
      instance = new FfmpegVideoProvider();
  }
  return instance;
}

export type {
  VideoProvider,
  VideoComposeInput,
  VideoComposeResult,
  BackgroundInput,
  AspectRatio,
  Resolution,
} from "./types";
