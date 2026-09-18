"use client";

import { useRef, useState } from "react";
import type { AudioAsset, VoiceTransform } from "@prisma/client";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBytes, formatDuration } from "@/lib/utils";

const VOICE_OPTIONS: { value: VoiceTransform; label: string; hint: string }[] = [
  { value: "NONE", label: "Voix originale", hint: "Aucune transformation" },
  { value: "FEMALE", label: "Voix féminine", hint: "Hausse le pitch, timbre naturel préservé" },
  { value: "MALE", label: "Voix masculine", hint: "Baisse le pitch, timbre naturel préservé" },
  { value: "DEEP", label: "Voix grave", hint: "Pitch nettement plus bas" },
  { value: "CHIPMUNK", label: "Voix aiguë (dessin animé)", hint: "Effet exagéré" },
  { value: "ROBOT", label: "Voix robotique", hint: "Effet métallique / vocodeur" },
];

interface Props {
  audioAsset: AudioAsset | null;
  onUploaded: (asset: AudioAsset) => void;
  onTransformed: (asset: AudioAsset) => void;
}

export function AudioStep({ audioAsset, onUploaded, onTransformed }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [pendingTransform, setPendingTransform] = useState<VoiceTransform>(audioAsset?.voiceTransform ?? "NONE");

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/audio", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Échec de l'import.");
      onUploaded(body.audioAsset);
      setPendingTransform("NONE");
      toast.success("Fichier audio importé.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'import.");
    } finally {
      setUploading(false);
    }
  }

  async function applyTransform() {
    if (!audioAsset) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/audio/${audioAsset.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transform: pendingTransform }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Échec de la conversion vocale.");
      onTransformed(body.audioAsset);
      if (pendingTransform !== "NONE") toast.success("Voix transformée avec succès.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la conversion vocale.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card
        className="cursor-pointer border-dashed transition-colors hover:border-primary"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          </div>
          <div>
            <p className="font-medium">Cliquez pour importer un fichier audio</p>
            <p className="text-sm text-muted-foreground">MP3, WAV, M4A, AAC, OGG, FLAC — 50 Mo max</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>

      {audioAsset && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{audioAsset.originalName}</span>
              <span className="text-muted-foreground">
                {formatDuration(audioAsset.durationSec)} · {formatBytes(audioAsset.sizeBytes ?? 0)}
              </span>
            </div>
            <audio controls src={audioAsset.url} className="w-full" />

            <div className="space-y-2">
              <p className="text-sm font-medium">Transformer la voix</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={pendingTransform} onValueChange={(v) => setPendingTransform(v as VoiceTransform)}>
                  <SelectTrigger className="sm:w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={applyTransform}
                  disabled={converting || pendingTransform === audioAsset.voiceTransform}
                  variant="secondary"
                >
                  {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Appliquer &amp; prévisualiser
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {VOICE_OPTIONS.find((o) => o.value === pendingTransform)?.hint}
              </p>
            </div>

            {audioAsset.voiceTransform !== "NONE" && audioAsset.processedUrl && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Aperçu — voix transformée</p>
                <audio controls src={audioAsset.processedUrl} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
