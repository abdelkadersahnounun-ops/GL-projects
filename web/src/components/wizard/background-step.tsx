"use client";

import Image from "next/image";
import { Check } from "lucide-react";

import type { BackgroundDTO } from "@/server/backgrounds";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function BackgroundStep({
  backgrounds,
  selectedId,
  onSelect,
}: {
  backgrounds: BackgroundDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {backgrounds.map((bg) => {
        const active = bg.id === selectedId;
        return (
          <button
            key={bg.id}
            type="button"
            onClick={() => onSelect(bg.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl border-2 text-left transition-all",
              active ? "border-primary shadow-md" : "border-transparent hover:border-border",
            )}
          >
            <div
              className="relative aspect-video w-full bg-secondary"
              style={bg.kind === "color" ? { backgroundColor: bg.colorValue ?? "#111" } : undefined}
            >
              {bg.kind !== "color" && (
                <Image src={bg.thumbnailUrl} alt={bg.name} fill sizes="360px" className="object-cover" />
              )}
              {active && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between bg-card p-3">
              <p className="text-sm font-semibold">{bg.name}</p>
              <Badge variant="secondary" className="text-[10px] capitalize">
                {bg.category}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}
