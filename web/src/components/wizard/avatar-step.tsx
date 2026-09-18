"use client";

import Image from "next/image";
import { Check } from "lucide-react";

import type { AvatarDTO } from "@/server/avatars";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GENDER_LABELS: Record<string, string> = { MALE: "Homme", FEMALE: "Femme", NEUTRAL: "Neutre" };

export function AvatarStep({
  avatars,
  selectedId,
  onSelect,
}: {
  avatars: AvatarDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {avatars.map((avatar) => {
        const active = avatar.id === selectedId;
        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl border-2 text-left transition-all",
              active ? "border-primary shadow-md" : "border-transparent hover:border-border",
            )}
          >
            <div className="relative aspect-square w-full bg-secondary">
              <Image src={avatar.thumbnailUrl} alt={avatar.name} fill sizes="240px" className="object-cover" />
              {active && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="space-y-1.5 bg-card p-3">
              <p className="text-sm font-semibold">{avatar.name}</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {avatar.style}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {GENDER_LABELS[avatar.gender] ?? avatar.gender}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {avatar.language}
                </Badge>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
