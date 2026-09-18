export interface ProjectAvatarDTO {
  id: string;
  name: string;
  thumbnailUrl: string;
  gender: string;
  style: string;
}

export interface ProjectBackgroundDTO {
  id: string;
  name: string;
  thumbnailUrl: string;
  kind: string;
  colorValue: string | null;
}

export interface ProjectAudioAssetDTO {
  id: string;
  originalName: string;
  url: string;
  processedUrl: string | null;
  voiceTransform: string;
  durationSec: number | null;
}

export interface ProjectJobDTO {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  stage: string;
  progress: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ProjectVideoDTO {
  id: string;
  jobId: string | null;
  url: string;
  durationSec: number | null;
  sizeBytes: number | null;
  resolution: string;
  aspectRatio: string;
  createdAt: string;
}

export interface ProjectDetailDTO {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  aspectRatio: string;
  resolution: string;
  subtitles: boolean;
  captionText: string | null;
  variantCount: number;
  avatar: ProjectAvatarDTO | null;
  background: ProjectBackgroundDTO | null;
  audioAsset: ProjectAudioAssetDTO | null;
  jobs: ProjectJobDTO[];
  videos: ProjectVideoDTO[];
}
