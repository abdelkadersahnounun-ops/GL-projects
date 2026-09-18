import Link from "next/link";
import Image from "next/image";
import { Sparkles, Video } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/components/project-status";
import { formatDuration } from "@/lib/utils";

export default async function ProjectsPage() {
  const session = await auth();
  const projects = await prisma.project.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { avatar: true, background: true, videos: true, jobs: true },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mes projets</h1>
          <p className="text-muted-foreground">Historique de tous vos projets et vidéos générées.</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Sparkles className="h-4 w-4" />
            Nouveau projet
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Video className="h-10 w-10" />
            <p>Vous n&apos;avez pas encore créé de projet.</p>
            <Button asChild>
              <Link href="/projects/new">Créer mon premier projet</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const firstVideo = p.videos[0];
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative aspect-video w-full bg-secondary">
                    {firstVideo ? (
                      <video src={firstVideo.url} className="h-full w-full object-cover" muted preload="metadata" />
                    ) : p.avatar ? (
                      <Image
                        src={p.avatar.thumbnailUrl}
                        alt={p.avatar.name}
                        fill
                        sizes="360px"
                        className="object-cover opacity-70"
                      />
                    ) : null}
                    <div className="absolute left-2 top-2">
                      <Badge variant={STATUS_VARIANTS[p.status] ?? "secondary"}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="space-y-1 pt-3">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.avatar?.name} · {p.background?.name} · {p.videos.length}/{p.variantCount} vidéo(s)
                      {firstVideo?.durationSec ? ` · ${formatDuration(firstVideo.durationSec)}` : ""}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
