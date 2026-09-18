import { runFfmpeg } from "@/server/ffmpeg/exec";

import type { VoiceConvertInput, VoiceProvider, VoiceTransform } from "./types";

/**
 * Real, local pitch/formant-based voice transformation using ffmpeg's
 * `rubberband` filter (high quality time-domain pitch shifting) plus a
 * couple of extra filters for the more "special-effect" presets.
 *
 * `formant=preserved` keeps the vocal-tract resonance natural while only
 * the pitch changes, which is what makes FEMALE/MALE/DEEP sound like a
 * different speaker rather than a sped-up/slowed-down tape.
 */
function buildFilterChain(transform: VoiceTransform): string | null {
  switch (transform) {
    case "FEMALE":
      return "rubberband=pitch=1.35:formant=preserved:pitchq=quality";
    case "MALE":
      return "rubberband=pitch=0.85:formant=preserved:pitchq=quality";
    case "DEEP":
      return "rubberband=pitch=0.68:formant=preserved:pitchq=quality";
    case "CHIPMUNK":
      // No formant preservation on purpose: gives the exaggerated cartoon effect.
      return "rubberband=pitch=1.75:formant=shifted:pitchq=quality";
    case "ROBOT":
      return [
        "rubberband=pitch=0.95:formant=preserved:pitchq=quality",
        "afreqshift=shift=40",
        "tremolo=f=28:d=0.35",
      ].join(",");
    case "NONE":
    default:
      return null;
  }
}

export class FfmpegVoiceProvider implements VoiceProvider {
  readonly name = "ffmpeg";

  async convert({ inputPath, outputPath, transform, onProgress }: VoiceConvertInput): Promise<void> {
    const filter = buildFilterChain(transform);

    await runFfmpeg(
      (cmd) => {
        cmd.input(inputPath);
        if (filter) cmd.audioFilters(filter);
        return cmd
          .audioCodec("libmp3lame")
          .audioBitrate("192k")
          .format("mp3")
          .output(outputPath);
      },
      (p) => onProgress?.(Math.min(99, Math.round(p.percent ?? 0))),
    );
  }
}
