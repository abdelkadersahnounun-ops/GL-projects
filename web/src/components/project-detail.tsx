"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Download, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import type { ProjectDetailDTO } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { JOB_STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS } from "@/components/project-status";
import { formatBytes, formatDuration } from "@/lib/utils";

const ACTIVE_STATUSES = new Set(["queued", "processing"]);
const POLL_INTERVAL_MS = 2000;

export function ProjectDetail({ initial }: { initial: ProjectDetailDTO }) {
  const [project, setProject] = useState(initial);
  const [retrying, setRetrying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${initial.id}`, { cache: "no-store" });
    if (!res.ok) return;
    const body = await res.json();
    setProject(body.project);
  }, [initial.id]);

  useEffect(() => {
    if (!ACTIVE_STATUSES.has(project.status)) return;
    timer.current = setTimeout(refresh, POLL_INTERVAL_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [project, refresh]);

  async function handleRetry() {
    setRetrying(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/retry`, { method: "POST" });
      if (!res.ok) throw new Error("Échec de la relance.");
      toast.success("Nouvelle génération lancée.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la relance.");
    } finally {
      setRetrying(false);
    }
  }

  const activeJobs = project.jobs.filter((j) => j.status === "PENDING" || j.status === "PROCESSING");
  const failedJobs = project.jobs.filter((j) => j.status === "FAILED");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.avatar?.name} · {project.background?.name}
          </p>
        </div>
        <Badge variant={STATUS_VARIANTS[project.status] ?? "secondary"} className="text-sm">
          {STATUS_LABELS[project.status] ?? project.status}
        </Badge>
      </div>

      {activeJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération en cours ({activeJobs.length}/{project.variantCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeJobs.map((job, i) => (
              <div key={job.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Vidéo {i + 1} — {JOB_STAGE_LABELS[job.stage] ?? job.stage}
                  </span>
                  <span className="text-muted-foreground">{job.progress}%</span>
                </div>
                <Progress value={job.progress} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {failedJobs.length > 0 && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium">La génération a échoué</p>
                <p className="text-sm text-muted-foreground">
                  {failedJobs[failedJobs.length - 1]?.errorMessage ?? "Une erreur inconnue est survenue."}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleRetry} disabled={retrying}>
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {project.videos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {project.videos.map((video, i) => (
            <Card key={video.id} className="overflow-hidden">
              <video controls src={video.url} className="aspect-video w-full bg-black" preload="metadata" />
              <CardContent className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-sm font-medium">Vidéo {i + 1}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(video.durationSec)} · {formatBytes(video.sizeBytes ?? 0)}
                  </p>
                </div>
                <Button asChild size="sm">
                  <a href={video.url} download>
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détails du projet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <DetailRow label="Audio source" value={project.audioAsset?.originalName ?? "—"} />
          <DetailRow label="Transformation vocale" value={project.audioAsset?.voiceTransform ?? "NONE"} />
          <DetailRow label="Format" value={project.aspectRatio.replace("_", " ")} />
          <DetailRow label="Résolution" value={project.resolution.replace("R_", "")} />
          <DetailRow label="Sous-titres" value={project.subtitles ? "Activés" : "Désactivés"} />
          {project.captionText && <DetailRow label="Légende" value={project.captionText} />}
        </CardContent>
      </Card>

      <Link href="/projects" className="inline-block text-sm text-muted-foreground hover:underline">
        ← Retour à l&apos;historique
      </Link>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
