import { prisma } from "@/server/db";
import { getStorageProvider } from "@/server/storage";

import type { AvatarDTO, AvatarProvider } from "./types";

/**
 * Demo avatar catalog backed by the `avatars` table (see prisma/seed.ts).
 * This lets the product run fully standalone: no external avatar API key
 * is required to try the whole flow end to end.
 */
export class MockAvatarProvider implements AvatarProvider {
  readonly name = "mock";

  async listAvatars(): Promise<AvatarDTO[]> {
    const avatars = await prisma.avatar.findMany({
      where: { isActive: true, provider: "mock" },
      orderBy: { createdAt: "asc" },
    });
    return avatars.map(toDTO);
  }

  async getAvatar(id: string): Promise<AvatarDTO | null> {
    const avatar = await prisma.avatar.findUnique({ where: { id } });
    return avatar ? toDTO(avatar) : null;
  }
}

function toDTO(a: {
  id: string;
  provider: string;
  externalId: string | null;
  name: string;
  type: string;
  style: string;
  gender: string;
  language: string;
  thumbnailKey: string;
  thumbnailUrl: string;
  previewVideoUrl: string | null;
}): AvatarDTO {
  return {
    id: a.id,
    provider: a.provider,
    externalId: a.externalId,
    name: a.name,
    type: a.type,
    style: a.style,
    gender: a.gender as AvatarDTO["gender"],
    language: a.language,
    thumbnailUrl: getStorageProvider().getObjectUrl(a.thumbnailKey) || a.thumbnailUrl,
    previewVideoUrl: a.previewVideoUrl,
  };
}
