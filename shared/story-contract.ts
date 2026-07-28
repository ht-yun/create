export type StoryVisibility = "private" | "unlisted" | "public";
export type StoryStatus = "draft" | "published" | "archived";
export type StoryNodeType = "scene" | "choice" | "condition" | "ending";
export type VariableType = "number" | "boolean" | "text";

export interface StoryVariableDefinition {
  key: string;
  label: string;
  type: VariableType;
  initialValue: number | boolean | string;
  min?: number;
  max?: number;
}

export interface VariableChange {
  key: string;
  operation: "set" | "add" | "subtract";
  value: number | boolean | string;
}

export interface StoryCondition {
  variable: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
  value: number | boolean | string;
}

export interface StoryChoice {
  id: string;
  label: string;
  targetNodeId: string;
  changes?: VariableChange[];
  conditions?: StoryCondition[];
  feedback?: string;
  importance?: "normal" | "key";
}

export interface StoryMedia {
  kind: "image" | "audio" | "video";
  url: string;
  playbackUrl?: string;
  alt?: string;
  role?: "scene" | "music" | "ambience" | "voice" | "effect";
  loop?: boolean;
  volume?: number;
  posterUrl?: string;
  focalPoint?: { x: number; y: number };
}

export interface StoryPackageAsset {
  id: string;
  kind: StoryMedia["kind"];
  path?: string;
  url?: string;
  mime?: string;
  size?: number;
  sha256?: string;
  originalName?: string;
}

export interface StoryPackage {
  format: "interactive-story";
  formatVersion: 1;
  story: {
    title: string;
    summary: string;
    authorName?: string;
    tags: string[];
    estimatedMinutes?: number;
    coverUrl?: string;
    graph: StoryGraph;
  };
  assets: StoryPackageAsset[];
}

export interface StoryPackageManifest {
  format: "interactive-story-pack";
  formatVersion: 1;
  files: Array<StoryPackageAsset & { path: string; mime: string; size: number; sha256: string }>;
}

export interface StoryImportError {
  path: string;
  code: string;
  message: string;
}

export interface StoryImportReport {
  valid: boolean;
  errors: StoryImportError[];
  warnings: string[];
  story?: Pick<StoryPackage["story"], "title" | "summary" | "authorName" | "tags" | "estimatedMinutes"> & {
    nodeCount: number;
    variableCount: number;
    endingCount: number;
    assetCount: number;
    totalSize: number;
  };
}

export interface StoryNode {
  id: string;
  type: StoryNodeType;
  title: string;
  speaker?: string;
  content: string;
  media?: StoryMedia[];
  choices?: StoryChoice[];
  nextNodeId?: string;
  endingKey?: string;
  position?: { x: number; y: number };
  presentation?: {
    transition?: "fade" | "dissolve" | "cut";
    textReveal?: "paragraph" | "instant";
  };
}

export interface StoryGraph {
  version: 1;
  startNodeId: string;
  variables: StoryVariableDefinition[];
  nodes: StoryNode[];
}

export interface StorySummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  authorName: string;
  coverUrl?: string;
  tags: string[];
  visibility: StoryVisibility;
  status: StoryStatus;
  estimatedMinutes: number;
  endingCount: number;
  favoriteCount: number;
  playCount: number;
  score: number;
  updatedAt: string;
}

export interface StoryDetail extends StorySummary {
  graph: StoryGraph;
}

export type StoryNarrationNodeState = "missing" | "pending" | "ready" | "failed" | "stale" | "manual";

export interface StoryNarrationSettings {
  voiceId: string;
  speed: number;
  volume: number;
}

export interface StoryNarrationNodeStatus {
  nodeId: string;
  title: string;
  status: StoryNarrationNodeState;
  errorMessage?: string;
  updatedAt?: string;
}

export interface StoryNarrationStatus {
  configured: boolean;
  provider: string;
  settings: StoryNarrationSettings;
  nodes: StoryNarrationNodeStatus[];
}

export interface StoryNarrationJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}
