import Link from "next/link";
import { ArrowRight, Clock, Film, Sparkles, Users, Video } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/components/project-status";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [projectCount, videoCount, avatarCount, recentProjects] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.video.count({ where: { project: { userId } } }),
    prisma.avatar.count({ where: { isActive: true } }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { avatar: true, videos: true, jobs: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue{session?.user.name ? `, ${session.user.name}` : ""}. Voici un aperçu de votre activité.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Film} label="Projets créés" value={projectCount} />
        <StatCard icon={Video} label="Vidéos générées" value={videoCount} />
        <StatCard icon={Users} label="Avatars disponibles" value={avatarCount} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Démarrer un nouveau projet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-sm text-muted-foreground">
            Choisissez un avatar, importez votre audio, transformez la voix et générez votre vidéo en quelques
            minutes.
          </p>
          <Button asChild size="lg">
            <Link href="/projects/new">
              <Sparkles className="h-4 w-4" />
              Nouveau projet
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Projets récents</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
              <Clock className="h-8 w-8" />
              <p>Aucun projet pour le moment.</p>
              <Button asChild>
                <Link href="/projects/new">Créer mon premier projet</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                      {p.avatar?.name.slice(0, 2).toUpperCase() ?? "AV"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.videos.length} vidéo{p.videos.length > 1 ? "s" : ""} · {p.avatar?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_VARIANTS[p.status] ?? "secondary"}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${p.id}`}>Ouvrir</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Film; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
