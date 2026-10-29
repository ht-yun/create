import type { StorySummary } from "@/shared/story-contract";
import { allDemoSummaries } from "./demo-data";

export type CommunityPostKind = "share" | "discussion";

export interface CommunityStoryRef {
  slug: string;
  title: string;
  authorName: string;
  summary: string;
  coverUrl?: string;
  tags: string[];
}

export interface CommunityPost {
  id: string;
  kind: CommunityPostKind;
  author: string;
  role: string;
  avatar: string;
  createdAt: string;
  title: string;
  body: string;
  tags: string[];
  likes: number;
  comments: number;
  story?: CommunityStoryRef;
}

function storyRef(slug: string): CommunityStoryRef | undefined {
  const story = allDemoSummaries.find((item) => item.slug === slug);
  if (!story) return undefined;
  return {
    slug: story.slug,
    title: story.title,
    authorName: story.authorName,
    summary: story.summary,
    coverUrl: story.coverUrl,
    tags: story.tags,
  };
}

const rainNight = storyRef("rain-night-visitor");
const eveningBreeze = storyRef("evening-breeze-says");
const homeSafety = storyRef("home-safety-fire-exit");
const afterSchool = storyRef("after-school-wind");

export const demoCommunityPosts: CommunityPost[] = [
  {
    id: "community-001",
    kind: "share",
    author: "一页纸",
    role: "故事收藏家",
    avatar: "页",
    createdAt: "18 分钟前",
    title: "这次我终于把信送到了她手里",
    body: "《晚风替我说》的第二个结局太适合在夏天晚上慢慢走。没有轰轰烈烈的告白，但每个停顿都很有分量。",
    tags: ["晚风替我说", "恋爱", "结局分享"],
    likes: 128,
    comments: 24,
    story: eveningBreeze,
  },
  {
    id: "community-002",
    kind: "discussion",
    author: "青石巷口",
    role: "悬疑线索控",
    avatar: "青",
    createdAt: "42 分钟前",
    title: "《雨夜来客》里，你们第一次相信陌生人了吗？",
    body: "我第一遍一直在观察窗外的脚印，第二遍才发现那封旧信上的落款才是关键。想看看大家第一次是怎么选的。",
    tags: ["雨夜来客", "悬疑", "无剧透讨论"],
    likes: 86,
    comments: 31,
    story: rainNight,
  },
  {
    id: "community-003",
    kind: "share",
    author: "住在故事里",
    role: "安全体验官",
    avatar: "住",
    createdAt: "1 小时前",
    title: "把家居安全系列整理成了一张清单",
    body: "连续走完几篇家居安全剧情后，我把里面出现过的检查点记在了一张清单里。原来很多危险不是看不见，而是习惯性忽略。",
    tags: ["家居类剧情", "生活观察", "作品推荐"],
    likes: 64,
    comments: 12,
    story: homeSafety,
  },
  {
    id: "community-004",
    kind: "discussion",
    author: "晚风收信人",
    role: "校园故事读者",
    avatar: "晚",
    createdAt: "昨天",
    title: "想和大家聊聊：互动故事里的“错过”算不算一种结局",
    body: "《晚自习后的风》让我想到，故事没有把所有关系都写成圆满，并不代表选择没有意义。你最喜欢哪一种不完美的结局？",
    tags: ["晚自习后的风", "校园", "开放讨论"],
    likes: 47,
    comments: 19,
    story: afterSchool,
  },
];

export const communityShareStories: StorySummary[] = allDemoSummaries.filter((story) => story.status === "published").slice(0, 12);
