import { mkdir, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";

import { prisma } from "@/server/db";
import { getStorageProvider } from "@/server/storage";
import { getVoiceProvider } from "@/server/voice";
import { getVideoProvider } from "@/server/video";
import type { BackgroundInput } from "@/server/video/types";

import { makeProgressReporter, setJobStage } from "./progress";

const TMP_DIR = path.join(os.tmpdir(), "avatarstudio-render");

/**
 * Runs one video generation job end to end:
 *   1. voice conversion (if the source audio has a transform selected and
 *      hasn't been converted yet)
 *   2. video composition (avatar + background + audio -> MP4) via the
 *      configured VideoProvider
 *   3. persists the resulting Video row and marks the job/project done
 *
 * Assumes the job has already been atomically claimed (status ===
 * PROCESSING) by `claimNextPendingJob`.
 */
export async function processJob(jobId: string): Promise<void> {
  const job = await prisma.videoJob.findUnique({
    where: { id: jobId },
    include: {
      project: {
        include: { avatar: true, background: true, audioAsset: true },
      },
    },
  });
  if (!job) return;

  const tmpFiles: string[] = [];
  await mkdir(TMP_DIR, { recursive: true });

  try {
    const { project } = job;
    if (!project.avatar || !project.background || !project.audioAsset) {
      throw new Error("Le projet est incomplet : avatar, arrière-plan ou audio manquant.");
    }

    await prisma.videoJob.update({
      where: { id: job.id },
      data: { attempts: { increment: 1 }, stage: "preparing", progress: 2 },
    });

    const storage = getStorageProvider();

    const avatarPath = await storage.getObjectPath(project.avatar.thumbnailKey);

    let background: BackgroundInput;
    if (project.background.kind === "color") {
      background = { kind: "color", colorValue: project.background.colorValue };
    } else {
      const assetPath = await storage.getObjectPath(project.background.assetKey!);
      background = { kind: project.background.kind as "image" | "video", assetPath };
    }

    // --- Stage 1: voice conversion (0-25%) --------------------------------
    let audioLocalPath = await storage.getObjectPath(project.audioAsset.storageKey);

    if (project.audioAsset.voiceTransform !== "NONE") {
      if (project.audioAsset.processingStatus === "done" && project.audioAsset.processedStorageKey) {
        audioLocalPath = await storage.getObjectPath(project.audioAsset.processedStorageKey);
        await setJobStage(job.id, "voice_conversion", 25);
      } else {
        await setJobStage(job.id, "voice_conversion", 6);
        await prisma.audioAsset.update({
          where: { id: project.audioAsset.id },
          data: { processingStatus: "processing" },
        });

        const voiceOut = path.join(TMP_DIR, `voice-${job.id}.mp3`);
        tmpFiles.push(voiceOut);

        const voice = getVoiceProvider();
        const report = makeProgressReporter(job.id, "voice_conversion", 6, 25);
        await voice.convert({
          inputPath: audioLocalPath,
          outputPath: voiceOut,
          transform: project.audioAsset.voiceTransform,
          onProgress: report,
        });

        const bytes = await readFile(voiceOut);
        const key = `processed/${project.audioAsset.id}.mp3`;
        const ref = await storage.putObject({ key, body: bytes, contentType: "audio/mpeg" });

        await prisma.audioAsset.update({
          where: { id: project.audioAsset.id },
          data: { processedStorageKey: ref.key, processedUrl: ref.url, processingStatus: "done" },
        });

        audioLocalPath = voiceOut;
      }
    }

    // --- Stage 2: video composition (25-92%) ------------------------------
    await setJobStage(job.id, "rendering", 28);
    const renderOut = path.join(TMP_DIR, `render-${job.id}.mp4`);
    tmpFiles.push(renderOut);

    const video = getVideoProvider();
    const report = makeProgressReporter(job.id, "rendering", 28, 92);
    const result = await video.compose({
      avatarImagePath: avatarPath,
      background,
      audioPath: audioLocalPath,
      captionText: project.captionText,
      subtitlesEnabled: project.subtitles,
      aspectRatio: project.aspectRatio,
      resolution: project.resolution,
      avatarScale: project.avatarScale,
      avatarPositionX: project.avatarPositionX,
      avatarPositionY: project.avatarPositionY,
      outputPath: renderOut,
      onProgress: report,
    });

    // --- Stage 3: persist (92-100%) ----------------------------------------
    await setJobStage(job.id, "encoding", 94);
    const bytes = await readFile(renderOut);
    const key = `renders/${project.id}/${job.id}.mp4`;
    const ref = await storage.putObject({ key, body: bytes, contentType: "video/mp4" });

    await prisma.video.create({
      data: {
        projectId: project.id,
        jobId: job.id,
        storageKey: ref.key,
        url: ref.url,
        durationSec: result.durationSec,
        sizeBytes: ref.sizeBytes,
        resolution: project.resolution,
        aspectRatio: project.aspectRatio,
      },
    });

    await prisma.videoJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", stage: "done", progress: 100, completedAt: new Date() },
    });
    await prisma.project.update({ where: { id: project.id }, data: { status: "completed" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.videoJob
      .update({ where: { id: job.id }, data: { status: "FAILED", stage: "failed", errorMessage: message } })
      .catch(() => undefined);
    await prisma.project
      .update({ where: { id: job.projectId }, data: { status: "failed" } })
      .catch(() => undefined);
  } finally {
    await Promise.all(tmpFiles.map((f) => rm(f, { force: true }).catch(() => undefined)));
  }
}
