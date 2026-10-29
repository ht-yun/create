import type { StoryGraph, StorySummary } from "./story-contract.js";

export type AiStoryPhase = "interview" | "outline" | "generated" | "applied";

export interface AiStoryPreferences {
  genre?: string;
  tone?: string;
  audience?: string;
  estimatedMinutes: number;
  endingCount: number;
  useVariables: boolean;
}

export interface AiStoryAnswer {
  key: string;
  question: string;
  answer: string;
}

export interface AiStoryBrief {
  idea: string;
  protagonist?: string;
  goal?: string;
  conflict?: string;
  tone?: string;
  keyChoice?: string;
  endingDirection?: string;
  answers: AiStoryAnswer[];
}

export interface AiStoryQuestion {
  key: string;
  prompt: string;
  options: string[];
  allowCustom: boolean;
}

export interface AiStoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AiStoryOutline {
  title: string;
  summary: string;
  tags: string[];
  opening: string;
  acts: Array<{ title: string; description: string }>;
  branches: Array<{ title: string; choice: string; consequence: string }>;
  endings: Array<{ title: string; description: string }>;
}

export interface AiStorySession {
  id: string;
  phase: AiStoryPhase;
  provider: string;
  brief: AiStoryBrief;
  preferences: AiStoryPreferences;
  question?: AiStoryQuestion;
  ready: boolean;
  outline?: AiStoryOutline;
  draftGraph?: StoryGraph;
  story?: StorySummary;
  messages: AiStoryMessage[];
  createdAt: string;
  updatedAt: string;
}
