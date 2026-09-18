import { probeDuration } from "@/server/ffmpeg/exec";
import { runFfmpegArgs } from "@/server/ffmpeg/spawn";

import type { AspectRatio, Resolution, VideoComposeInput, VideoComposeResult, VideoProvider } from "./types";

const CAPTION_FONT = process.env.VIDEO_CAPTION_FONT || "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const SHORT_EDGE: Record<Resolution, number> = { R_720P: 720, R_1080P: 1080, R_4K: 2160 };
const MAX_CAPTION_LENGTH = 160;

function even(n: number): number {
  return Math.round(n / 2) * 2;
}

function dimensions(aspectRatio: AspectRatio, resolution: Resolution): { width: number; height: number } {
  const short = SHORT_EDGE[resolution];
  const long = even((short * 16) / 9);
  switch (aspectRatio) {
    case "PORTRAIT_9_16":
      return { width: even(short), height: long };
    case "SQUARE_1_1":
      return { width: even(short), height: even(short) };
    case "LANDSCAPE_16_9":
    default:
      return { width: long, height: even(short) };
  }
}

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "’")
    .replace(/%/g, "\\%")
    .slice(0, MAX_CAPTION_LENGTH);
}

export class FfmpegVideoProvider implements VideoProvider {
  readonly name = "ffmpeg";

  async compose(input: VideoComposeInput): Promise<VideoComposeResult> {
    const {
      avatarImagePath,
      background,
      audioPath,
      captionText,
      subtitlesEnabled,
      aspectRatio,
      resolution,
      avatarScale,
      avatarPositionX,
      avatarPositionY,
      outputPath,
      onProgress,
    } = input;

    const durationSec = await probeDuration(audioPath);
    const renderDuration = Math.max(durationSec, 0.5) + 0.4;
    const { width, height } = dimensions(aspectRatio, resolution);

    const args: string[] = [];

    // --- Input 0: background plate --------------------------------------
    if (background.kind === "color") {
      args.push(
        "-f", "lavfi",
        "-t", renderDuration.toFixed(2),
        "-i", `color=c=${background.colorValue || "#12121a"}:s=${width}x${height}:r=30`,
      );
    } else if (background.kind === "video") {
      args.push("-stream_loop", "-1", "-t", renderDuration.toFixed(2), "-i", background.assetPath!);
    } else {
      args.push("-loop", "1", "-t", renderDuration.toFixed(2), "-i", background.assetPath!);
    }

    // --- Input 1: avatar card (static PNG, looped) -----------------------
    args.push("-loop", "1", "-t", renderDuration.toFixed(2), "-i", avatarImagePath);

    // --- Input 2: final audio track --------------------------------------
    args.push("-i", audioPath);

    const avatarBox = Math.round(Math.min(width, height) * 0.5 * clamp(avatarScale, 0.5, 1.6));
    const posX = clamp(avatarPositionX, 0, 1);
    const posY = clamp(avatarPositionY, 0, 1);

    const filters: string[] = [];
    filters.push(
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,fps=30,format=yuv420p[bg]`,
    );
    // Gentle "idle breathing" zoom keeps a static avatar photo from looking frozen.
    filters.push(
      `[1:v]format=rgba,scale=w='${avatarBox}*(1+0.018*sin(2*PI*t/4))':h=-1:eval=frame[avt]`,
    );
    filters.push(
      `[bg][avt]overlay=x='(W*${posX})-(w/2)':y='(H*${posY})-(h/2)':shortest=1[ov1]`,
    );
    // Live waveform tied to the real audio track being played.
    const waveW = Math.max(320, Math.round(width * 0.46));
    filters.push(
      `[2:a]showwaves=s=${waveW}x70:mode=cline:colors=0xf5f3ff|0xd946ef:scale=sqrt,format=rgba,colorchannelmixer=aa=0.85[wave]`,
    );
    filters.push(`[ov1][wave]overlay=x=(W-w)/2:y=H-h-36[ov2]`);

    let lastLabel = "ov2";
    if (subtitlesEnabled && captionText && captionText.trim().length > 0) {
      const safe = escapeDrawtext(captionText.trim());
      const fontSize = Math.round(height * 0.038);
      filters.push(
        `[ov2]drawtext=fontfile=${CAPTION_FONT}:text='${safe}':fontcolor=white:fontsize=${fontSize}:` +
          `box=1:boxcolor=black@0.55:boxborderw=16:x=(w-text_w)/2:y=h-${Math.round(height * 0.16)}:line_spacing=6[ov3]`,
      );
      lastLabel = "ov3";
    }

    args.push("-filter_complex", filters.join(";"));
    args.push("-map", `[${lastLabel}]`, "-map", "2:a");
    args.push(
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      "-r", "30",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      "-movflags", "+faststart",
      outputPath,
    );

    await runFfmpegArgs(args, durationSec, onProgress);

    const finalDuration = await probeDuration(outputPath);
    return { outputPath, durationSec: finalDuration };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
