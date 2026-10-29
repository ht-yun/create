import type { StoryDetail, StorySummary } from "@/shared/story-contract";
import { allDemoSummaries, demoStories } from "./demo-data";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const API_TIMEOUT_MS = /localhost|127\.0\.0\.1/.test(API_URL) ? 350 : 1800;

async function fetchFromApi(input: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getStories(): Promise<StorySummary[]> {
  try {
    const response = await fetchFromApi(`${API_URL}/stories`, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const stories = await response.json() as StorySummary[];
    if (!stories.length) return allDemoSummaries;
    const demoBySlug = new Map(allDemoSummaries.map((story) => [story.slug, story]));
    const enrichedStories = stories.map((story) => ({
      ...story,
      coverUrl: story.coverUrl ?? demoBySlug.get(story.slug)?.coverUrl,
    }));
    return [...enrichedStories, ...allDemoSummaries.filter((demo) => !stories.some((story) => story.slug === demo.slug))];
  } catch {
    return allDemoSummaries;
  }
}

export async function getStory(slug: string): Promise<StoryDetail | null> {
  const localDemo = demoStories.find((story) => story.slug === slug);
  if (localDemo) return localDemo;

  try {
    const response = await fetchFromApi(`${API_URL}/stories/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.ok) return await response.json() as StoryDetail;
  } catch {
    // The public demo remains playable while the local API is not running.
  }
  return null;
}

export function compactCount(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}千`;
  return String(value);
}
