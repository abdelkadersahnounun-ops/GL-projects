import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { ProjectDetail } from "@/components/project-detail";
import type { ProjectDetailDTO } from "@/types/project";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { avatar: true, background: true, audioAsset: true, jobs: true, videos: true },
  });

  if (!project || project.userId !== session.user.id) notFound();

  const dto: ProjectDetailDTO = {
    id: project.id,
    name: project.name,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    aspectRatio: project.aspectRatio,
    resolution: project.resolution,
    subtitles: project.subtitles,
    captionText: project.captionText,
    variantCount: project.variantCount,
    avatar: project.avatar
      ? {
          id: project.avatar.id,
          name: project.avatar.name,
          thumbnailUrl: project.avatar.thumbnailUrl,
          gender: project.avatar.gender,
          style: project.avatar.style,
        }
      : null,
    background: project.background
      ? {
          id: project.background.id,
          name: project.background.name,
          thumbnailUrl: project.background.thumbnailUrl,
          kind: project.background.kind,
          colorValue: project.background.colorValue,
        }
      : null,
    audioAsset: project.audioAsset
      ? {
          id: project.audioAsset.id,
          originalName: project.audioAsset.originalName,
          url: project.audioAsset.url,
          processedUrl: project.audioAsset.processedUrl,
          voiceTransform: project.audioAsset.voiceTransform,
          durationSec: project.audioAsset.durationSec,
        }
      : null,
    jobs: project.jobs
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((j) => ({
        id: j.id,
        status: j.status,
        stage: j.stage,
        progress: j.progress,
        errorMessage: j.errorMessage,
        createdAt: j.createdAt.toISOString(),
        completedAt: j.completedAt ? j.completedAt.toISOString() : null,
      })),
    videos: project.videos
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((v) => ({
        id: v.id,
        jobId: v.jobId,
        url: v.url,
        durationSec: v.durationSec,
        sizeBytes: v.sizeBytes,
        resolution: v.resolution,
        aspectRatio: v.aspectRatio,
        createdAt: v.createdAt.toISOString(),
      })),
  };

  return (
    <div className="mx-auto max-w-4xl">
      <ProjectDetail initial={dto} />
    </div>
  );
}
