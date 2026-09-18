import { prisma } from "@/server/db";
import { getStorageProvider } from "@/server/storage";

export interface BackgroundDTO {
  id: string;
  name: string;
  category: string;
  kind: string;
  colorValue: string | null;
  thumbnailUrl: string;
  assetUrl: string | null;
}

export async function listBackgrounds(): Promise<BackgroundDTO[]> {
  const storage = getStorageProvider();
  const backgrounds = await prisma.background.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return backgrounds.map((b) => ({
    id: b.id,
    name: b.name,
    category: b.category,
    kind: b.kind,
    colorValue: b.colorValue,
    thumbnailUrl: storage.getObjectUrl(b.thumbnailKey),
    assetUrl: b.assetKey ? storage.getObjectUrl(b.assetKey) : null,
  }));
}
