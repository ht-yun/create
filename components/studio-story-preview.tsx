"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { StoryPlayer } from "@/components/story-player";
import type { StoryDetail } from "@/shared/story-contract";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function StudioStoryPreview() {
  const storyId = useSearchParams().get("storyId");
  const [story, setStory] = useState<StoryDetail>();
  const [error, setError] = useState("");
  useEffect(() => {
    if (!storyId) { setError("缺少作品 ID"); return; }
    const controller = new AbortController();
    fetch(`${API_URL}/stories/edit/${encodeURIComponent(storyId)}`, { credentials: "include", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error(response.status === 401 ? "请先登录" : "无法载入草稿"); return response.json() as Promise<StoryDetail>; })
      .then(setStory)
      .catch((cause) => { if (cause instanceof Error && cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, [storyId]);
  if (story) return <StoryPlayer story={story} />;
  return <main className="studio-preview-loading"><Link href={storyId ? `/studio/editor?storyId=${encodeURIComponent(storyId)}` : "/studio"}><ArrowLeft size={16} />返回编辑器</Link>{error ? <p>{error}</p> : <p><LoaderCircle className="spin" size={18} />正在准备剧情预览…</p>}</main>;
}
