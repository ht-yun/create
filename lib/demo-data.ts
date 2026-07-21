import type { StoryDetail, StorySummary } from "@/shared/story-contract";
import { rainVisitorGraph } from "@/backend/src/stories/sample-stories";
import { mistCatchGraph } from "./mist-catch-story";
import { eveningBreezeWebGraph } from "./evening-breeze-web-story";

const updatedAt = "2026-07-16T08:00:00.000Z";

export const demoStories: StoryDetail[] = [
  {
    id: "demo-rain",
    slug: "rain-night-visitor",
    title: "雨夜来客",
    summary: "一个雨夜，一封旧信，与一位知道你家族秘密的陌生人。你的信任会决定真相能否抵达黎明。",
    authorName: "青篁",
    tags: ["悬疑", "古风", "多结局"],
    visibility: "public",
    status: "published",
    estimatedMinutes: 12,
    endingCount: 3,
    favoriteCount: 6832,
    playCount: 24860,
    score: 9.4,
    updatedAt,
    graph: rainVisitorGraph,
  },
  {
    id: "demo-breeze",
    slug: "evening-breeze-says",
    title: "晚风替我说",
    summary: "夏末站台上的重逢，旧歌单与未说出口的喜欢。只差一次勇敢，故事就会走向不同明天。",
    authorName: "南栀",
    tags: ["恋爱", "青春", "治愈"],
    visibility: "public",
    status: "published",
    estimatedMinutes: 10,
    endingCount: 3,
    favoriteCount: 10431,
    playCount: 31720,
    score: 9.7,
    updatedAt,
    coverUrl: "/story-assets/evening-breeze/L-00%20%E4%BD%9C%E5%93%81%E4%B8%BB%E5%B0%81%E9%9D%A2.png",
    graph: eveningBreezeWebGraph,
  },
  {
    id: "demo-mist-catch",
    slug: "mist-catch-last-lamp",
    title: "雾港追捕：最后一盏灯",
    summary: "年轻民警林峥追捕惯偷周骁，在证据、同情、程序正义和群众安全之间作出选择。你会相信他关于重病母亲的说法吗？",
    authorName: "折枝编辑部",
    tags: ["刑侦", "悬疑", "追捕", "多结局"],
    visibility: "public",
    status: "published",
    estimatedMinutes: 35,
    endingCount: 5,
    favoriteCount: 0,
    playCount: 0,
    score: 0,
    updatedAt,
    coverUrl: "/story-assets/optimized/mist-catch/%E3%80%8A%E9%9B%BE%E6%B8%AF%E8%BF%BD%E6%8D%95%EF%BC%9A%E6%9C%80%E5%90%8E%E4%B8%80%E7%9B%8F%E7%81%AF%E3%80%8B.webp",
    graph: mistCatchGraph,
  },
];

export const extraDemoStories: StorySummary[] = [
  {
    id: "demo-changan", slug: "changan-mystery", title: "长安异闻录", summary: "在灯市与暗巷之间追索一桩被抹去的旧案。", authorName: "砚北",
    tags: ["奇幻", "探案"], visibility: "public", status: "published", estimatedMinutes: 28, endingCount: 6,
    favoriteCount: 8240, playCount: 42680, score: 9.5, updatedAt,
  },
  {
    id: "demo-star", slug: "starship-last-message", title: "星舰最后一封信", summary: "当返航只剩一个座位，你要替谁保留回家的可能。", authorName: "织星者",
    tags: ["科幻", "抉择"], visibility: "public", status: "published", estimatedMinutes: 22, endingCount: 5,
    favoriteCount: 7120, playCount: 35910, score: 9.3, updatedAt,
  },
  {
    id: "demo-teahouse", slug: "teahouse-letters", title: "茶馆来信", summary: "每一封无人认领的信，都通向小城里一段未完的人生。", authorName: "白榆",
    tags: ["治愈", "群像"], visibility: "public", status: "published", estimatedMinutes: 18, endingCount: 4,
    favoriteCount: 6540, playCount: 28340, score: 9.2, updatedAt,
  },
  {
    id: "demo-campus", slug: "seventeen-summer", title: "十七岁的夏天", summary: "毕业前的七天里，重新认识那些熟悉又陌生的人。", authorName: "木棉",
    tags: ["校园", "恋爱"], visibility: "public", status: "published", estimatedMinutes: 16, endingCount: 7,
    favoriteCount: 9890, playCount: 40210, score: 9.6, updatedAt,
  },
];

export const allDemoSummaries: StorySummary[] = [
  ...demoStories.map((story) => ({ id: story.id, slug: story.slug, title: story.title, summary: story.summary, authorName: story.authorName, coverUrl: story.coverUrl, tags: story.tags, visibility: story.visibility, status: story.status, estimatedMinutes: story.estimatedMinutes, endingCount: story.endingCount, favoriteCount: story.favoriteCount, playCount: story.playCount, score: story.score, updatedAt: story.updatedAt })),
  ...extraDemoStories,
];
