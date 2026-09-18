export type AspectRatio = "LANDSCAPE_16_9" | "PORTRAIT_9_16" | "SQUARE_1_1";
export type Resolution = "R_720P" | "R_1080P" | "R_4K";

export interface BackgroundInput {
  kind: "image" | "video" | "color";
  /** Local filesystem path to the background asset (unused when kind === "color"). */
  assetPath?: string;
  colorValue?: string | null;
}

export interface VideoComposeInput {
  avatarImagePath: string;
  background: BackgroundInput;
  /** Path to the final audio track to sync the video to (already voice-converted if requested). */
  audioPath: string;
  captionText?: string | null;
  subtitlesEnabled: boolean;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  avatarScale: number;
  avatarPositionX: number;
  avatarPositionY: number;
  outputPath: string;
  onProgress?: (percent: number) => void;
}

export interface VideoComposeResult {
  outputPath: string;
  durationSec: number;
}

/**
 * VideoProvider abstracts however the final talking-avatar video is
 * actually produced. `FfmpegVideoProvider` composites a real MP4 locally
 * (background plate + animated avatar card + synced audio + optional
 * burned-in caption + live audio-reactive waveform) so the whole pipeline
 * is genuinely functional without any paid API. A production deployment
 * can add a provider that calls a real talking-avatar API (HeyGen, D-ID,
 * Synthesia, Argil...) behind the same interface.
 */
export interface VideoProvider {
  readonly name: string;
  compose(input: VideoComposeInput): Promise<VideoComposeResult>;
}
