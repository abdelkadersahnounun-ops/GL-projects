import type { BadgeProps } from "@/components/ui/badge";

export const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  queued: "En file d'attente",
  processing: "En cours",
  completed: "Terminé",
  failed: "Échec",
};

export const STATUS_VARIANTS: Record<string, NonNullable<BadgeProps["variant"]>> = {
  draft: "outline",
  queued: "secondary",
  processing: "secondary",
  completed: "success",
  failed: "destructive",
};

export const JOB_STAGE_LABELS: Record<string, string> = {
  queued: "En file d'attente",
  preparing: "Préparation",
  voice_conversion: "Conversion de la voix",
  rendering: "Composition de la vidéo",
  encoding: "Finalisation",
  done: "Terminé",
  failed: "Échec",
};
