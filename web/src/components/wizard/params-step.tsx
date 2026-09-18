"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface ProjectParams {
  name: string;
  aspectRatio: "LANDSCAPE_16_9" | "PORTRAIT_9_16" | "SQUARE_1_1";
  resolution: "R_720P" | "R_1080P" | "R_4K";
  subtitles: boolean;
  captionText: string;
  variantCount: number;
  avatarScale: number;
  avatarPositionX: number;
  avatarPositionY: number;
}

export function ParamsStep({ params, onChange }: { params: ProjectParams; onChange: (p: ProjectParams) => void }) {
  function set<K extends keyof ProjectParams>(key: K, value: ProjectParams[K]) {
    onChange({ ...params, [key]: value });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du projet</Label>
        <Input id="name" value={params.name} onChange={(e) => set("name", e.target.value)} placeholder="Ma vidéo" />
      </div>

      <div className="space-y-2">
        <Label>Format</Label>
        <Select value={params.aspectRatio} onValueChange={(v) => set("aspectRatio", v as ProjectParams["aspectRatio"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LANDSCAPE_16_9">Paysage (16:9) — YouTube</SelectItem>
            <SelectItem value="PORTRAIT_9_16">Portrait (9:16) — Reels / TikTok</SelectItem>
            <SelectItem value="SQUARE_1_1">Carré (1:1) — Feed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Résolution</Label>
        <Select value={params.resolution} onValueChange={(v) => set("resolution", v as ProjectParams["resolution"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="R_720P">720p</SelectItem>
            <SelectItem value="R_1080P">1080p (Full HD)</SelectItem>
            <SelectItem value="R_4K">4K (Ultra HD)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Nombre de variantes à générer</Label>
        <Select value={String(params.variantCount)} onValueChange={(v) => set("variantCount", Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} vidéo{n > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 lg:col-span-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="subtitles">Sous-titres incrustés</Label>
          <Switch id="subtitles" checked={params.subtitles} onCheckedChange={(v) => set("subtitles", v)} />
        </div>
        {params.subtitles && (
          <Textarea
            value={params.captionText}
            onChange={(e) => set("captionText", e.target.value.slice(0, 160))}
            placeholder="Texte à afficher en légende (160 caractères max)"
            maxLength={160}
          />
        )}
      </div>

      <div className="space-y-3 lg:col-span-2">
        <Label>Taille de l&apos;avatar : {Math.round(params.avatarScale * 100)}%</Label>
        <Slider
          min={0.5}
          max={1.6}
          step={0.05}
          value={[params.avatarScale]}
          onValueChange={([v]) => set("avatarScale", v)}
        />
      </div>

      <div className="space-y-3">
        <Label>Position horizontale</Label>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[params.avatarPositionX]}
          onValueChange={([v]) => set("avatarPositionX", v)}
        />
      </div>

      <div className="space-y-3">
        <Label>Position verticale</Label>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[params.avatarPositionY]}
          onValueChange={([v]) => set("avatarPositionY", v)}
        />
      </div>
    </div>
  );
}
