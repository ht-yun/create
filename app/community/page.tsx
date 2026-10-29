import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CommunityHub } from "@/components/community-hub";
import { demoCommunityPosts, communityShareStories } from "@/lib/community-data";
import { getStory } from "@/lib/api";

export const metadata: Metadata = {
  title: "社区",
  description: "分享喜欢的作品，和其他读者讨论互动故事。",
};

export default async function CommunityPage({ searchParams }: { searchParams?: Promise<{ share?: string; topic?: string }> }) {
  const params = await searchParams;
  const shareSlug = params?.share;
  const story = shareSlug ? await getStory(shareSlug) : null;
  const initialShareStory = story ? {
    slug: story.slug,
    title: story.title,
    authorName: story.authorName,
    summary: story.summary,
    coverUrl: story.coverUrl,
    tags: story.tags,
  } : undefined;

  return <AppShell active="community"><CommunityHub initialPosts={demoCommunityPosts} shareStories={communityShareStories} initialShareStory={initialShareStory} initialTopic={params?.topic} /></AppShell>;
}
