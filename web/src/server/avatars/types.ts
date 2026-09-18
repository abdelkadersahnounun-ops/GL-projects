export type AvatarGender = "MALE" | "FEMALE" | "NEUTRAL";

export interface AvatarDTO {
  id: string;
  provider: string;
  externalId: string | null;
  name: string;
  type: string;
  style: string;
  gender: AvatarGender;
  language: string;
  thumbnailUrl: string;
  previewVideoUrl: string | null;
}

/**
 * AvatarProvider abstracts wherever the avatar catalog and the underlying
 * "make this avatar speak this audio" capability actually comes from.
 *
 * `MockAvatarProvider` ships a ready-to-use demo catalog backed by the
 * local database/seed data and renders locally with ffmpeg so the whole
 * product works with zero external accounts. A production deployment can
 * add e.g. `HeyGenAvatarProvider` or `DIdAvatarProvider` implementing the
 * same interface — nothing else in the app changes.
 */
export interface AvatarProvider {
  readonly name: string;
  listAvatars(): Promise<AvatarDTO[]>;
  getAvatar(id: string): Promise<AvatarDTO | null>;
}
