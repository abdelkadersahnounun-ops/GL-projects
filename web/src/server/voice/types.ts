export type VoiceTransform = "NONE" | "FEMALE" | "MALE" | "ROBOT" | "DEEP" | "CHIPMUNK";

export interface VoiceConvertInput {
  inputPath: string;
  outputPath: string;
  transform: VoiceTransform;
  onProgress?: (percent: number) => void;
}

/**
 * VoiceProvider abstracts voice conversion / transformation. The default
 * `FfmpegVoiceProvider` performs a real, local pitch & formant based
 * transformation (no external API key needed) so "convert to a female
 * voice" genuinely works out of the box. A neural voice-conversion API
 * (e.g. ElevenLabs voice changer, Resemble AI) can be plugged in later by
 * implementing the same interface.
 */
export interface VoiceProvider {
  readonly name: string;
  convert(input: VoiceConvertInput): Promise<void>;
}
