import Image from "next/image";
import type { AudioAsset } from "@prisma/client";

import type { AvatarDTO } from "@/server/avatars";
import type { BackgroundDTO } from "@/server/backgrounds";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

import type { ProjectParams } from "./params-step";

const ASPECT_LABELS: Record<string, string> = {
  LANDSCAPE_16_9: "Paysage (16:9)",
  PORTRAIT_9_16: "Portrait (9:16)",
  SQUARE_1_1: "Carré (1:1)",
};
const RESOLUTION_LABELS: Record<string, string> = { R_720P: "720p", R_1080P: "1080p", R_4K: "4K" };
const TRANSFORM_LABELS: Record<string, string> = {
  NONE: "Voix originale",
  FEMALE: "Voix féminine",
  MALE: "Voix masculine",
  DEEP: "Voix grave",
  CHIPMUNK: "Voix aiguë",
  ROBOT: "Voix robotique",
};

export function ReviewStep({
  avatar,
  background,
  audioAsset,
  params,
}: {
  avatar: AvatarDTO | null;
  background: BackgroundDTO | null;
  audioAsset: AudioAsset | null;
  params: ProjectParams;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border border-border p-3">
          {avatar && (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-secondary">
              <Image src={avatar.thumbnailUrl} alt={avatar.name} fill sizes="56px" className="object-cover" />
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Avatar</p>
            <p className="font-medium">{avatar?.name ?? "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border p-3">
          {background && background.kind !== "color" ? (
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
              <Image src={background.thumbnailUrl} alt={background.name} fill sizes="80px" className="object-cover" />
            </div>
          ) : (
            <div
              className="h-14 w-20 shrink-0 rounded-md"
              style={{ backgroundColor: background?.colorValue ?? "#111" }}
            />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Décor</p>
            <p className="font-medium">{background?.name ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <p className="mb-1 text-xs text-muted-foreground">Audio</p>
        <p className="font-medium">
          {audioAsset?.originalName} · {formatDuration(audioAsset?.durationSec)}
        </p>
        <Badge variant="secondary" className="mt-2">
          {TRANSFORM_LABELS[audioAsset?.voiceTransform ?? "NONE"]}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{params.name || "Projet sans titre"}</Badge>
        <Badge variant="outline">{ASPECT_LABELS[params.aspectRatio]}</Badge>
        <Badge variant="outline">{RESOLUTION_LABELS[params.resolution]}</Badge>
        <Badge variant="outline">
          {params.variantCount} vidéo{params.variantCount > 1 ? "s" : ""}
        </Badge>
        {params.subtitles && <Badge variant="outline">Sous-titres activés</Badge>}
      </div>
    </div>
  );
}
