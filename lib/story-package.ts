import type { StoryImportReport } from "@/shared/story-contract";
import { API_URL } from "./api";

export async function validateStoryFile(file: File): Promise<StoryImportReport> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/stories/import/validate`, { method: "POST", body, credentials: "include" });
  const payload = await response.json() as StoryImportReport | { error?: { message?: string } };
  if (!response.ok) throw new Error("error" in payload && payload.error?.message ? payload.error.message : "剧情文件校验失败");
  return payload as StoryImportReport;
}

export async function importStoryFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/stories/import`, { method: "POST", body, credentials: "include" });
  const payload = await response.json() as { id?: string; slug?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "剧情导入失败");
  return payload;
}

export function storyExportUrl(storyId: string, format: "json" | "storypack") {
  return `${API_URL}/stories/export/${encodeURIComponent(storyId)}?format=${format}`;
}
