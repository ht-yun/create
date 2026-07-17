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
}

export interface StoryMedia {
  kind: "image" | "audio" | "video";
  url: string;
  alt?: string;
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
