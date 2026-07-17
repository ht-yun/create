import { notFound } from "next/navigation";
import { StoryPlayer } from "@/components/story-player";
import { getStory } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const story = await getStory((await params).slug);
  return story ? { title: story.title, description: story.summary } : { title: "作品不存在" };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const story = await getStory((await params).slug);
  if (!story) notFound();
  return <StoryPlayer story={story} />;
}
