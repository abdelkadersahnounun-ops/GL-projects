"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AudioAsset } from "@prisma/client";
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import type { AvatarDTO } from "@/server/avatars";
import type { BackgroundDTO } from "@/server/backgrounds";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { AvatarStep } from "./avatar-step";
import { AudioStep } from "./audio-step";
import { BackgroundStep } from "./background-step";
import { ParamsStep, type ProjectParams } from "./params-step";
import { ReviewStep } from "./review-step";

const STEPS = ["Avatar", "Audio", "Décor", "Paramètres", "Résumé"] as const;

export function ProjectWizard({
  avatars,
  backgrounds,
  initialAvatarId,
}: {
  avatars: AvatarDTO[];
  backgrounds: BackgroundDTO[];
  initialAvatarId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [avatarId, setAvatarId] = useState<string | null>(initialAvatarId ?? null);
  const [audioAsset, setAudioAsset] = useState<AudioAsset | null>(null);
  const [backgroundId, setBackgroundId] = useState<string | null>(null);
  const [params, setParams] = useState<ProjectParams>({
    name: "",
    aspectRatio: "LANDSCAPE_16_9",
    resolution: "R_1080P",
    subtitles: false,
    captionText: "",
    variantCount: 1,
    avatarScale: 1,
    avatarPositionX: 0.5,
    avatarPositionY: 0.85,
  });

  const selectedAvatar = useMemo(() => avatars.find((a) => a.id === avatarId) ?? null, [avatars, avatarId]);
  const selectedBackground = useMemo(
    () => backgrounds.find((b) => b.id === backgroundId) ?? null,
    [backgrounds, backgroundId],
  );

  const canGoNext = [
    !!avatarId,
    !!audioAsset,
    !!backgroundId,
    params.name.trim().length > 0,
    true,
  ][step];

  async function handleSubmit() {
    if (!avatarId || !backgroundId || !audioAsset) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: params.name.trim() || "Projet sans titre",
          avatarId,
          backgroundId,
          audioAssetId: audioAsset.id,
          aspectRatio: params.aspectRatio,
          resolution: params.resolution,
          subtitles: params.subtitles,
          captionText: params.subtitles ? params.captionText : null,
          variantCount: params.variantCount,
          avatarScale: params.avatarScale,
          avatarPositionX: params.avatarPositionX,
          avatarPositionY: params.avatarPositionY,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Échec de la création du projet.");
      toast.success("Génération lancée !");
      router.push(`/projects/${body.project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la création du projet.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                i === step && "border-primary bg-primary text-primary-foreground",
                i < step && "border-success/40 bg-success/10 text-success cursor-pointer",
                i > step && "border-border text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  i === step && "bg-primary-foreground/20",
                  i < step && "bg-success text-success-foreground",
                )}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 && <div className="h-px w-4 bg-border sm:w-8" />}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="pt-6">
          {step === 0 && <AvatarStep avatars={avatars} selectedId={avatarId} onSelect={setAvatarId} />}
          {step === 1 && (
            <AudioStep audioAsset={audioAsset} onUploaded={setAudioAsset} onTransformed={setAudioAsset} />
          )}
          {step === 2 && (
            <BackgroundStep backgrounds={backgrounds} selectedId={backgroundId} onSelect={setBackgroundId} />
          )}
          {step === 3 && <ParamsStep params={params} onChange={setParams} />}
          {step === 4 && (
            <ReviewStep
              avatar={selectedAvatar}
              background={selectedBackground}
              audioAsset={audioAsset}
              params={params}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={!canGoNext}>
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} size="lg">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Générer {params.variantCount > 1 ? `${params.variantCount} vidéos` : "la vidéo"}
          </Button>
        )}
      </div>
    </div>
  );
}
