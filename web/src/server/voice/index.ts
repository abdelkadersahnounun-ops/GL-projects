import { FfmpegVoiceProvider } from "./ffmpeg-provider";
import type { VoiceProvider } from "./types";

let instance: VoiceProvider | null = null;

export function getVoiceProvider(): VoiceProvider {
  if (instance) return instance;
  const kind = process.env.VOICE_PROVIDER ?? "ffmpeg";
  switch (kind) {
    case "ffmpeg":
    default:
      instance = new FfmpegVoiceProvider();
  }
  return instance;
}

export type { VoiceProvider, VoiceConvertInput, VoiceTransform } from "./types";
