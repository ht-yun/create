import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { DatabaseService } from "./database/database.service.js";
import { eveningBreezeGraph, rainVisitorGraph } from "./stories/sample-stories.js";

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async onApplicationBootstrap() {
    const existing = await this.database.query<{ count: string }>("SELECT count(*)::text AS count FROM stories");
    if (Number(existing.rows[0].count) > 0) return;
    const samples = [
      {
        slug: "rain-night-visitor", title: "雨夜来客", author: "青篁",
        summary: "一个雨夜，一封旧信，与一位知道你家族秘密的陌生人。你的信任会决定真相能否抵达黎明。",
        tags: ["悬疑", "古风", "多结局"], graph: rainVisitorGraph, minutes: 12, endings: 3, plays: 24860, favorites: 6832, score: 9.4,
      },
      {
        slug: "evening-breeze-says", title: "晚风替我说", author: "南栀",
        summary: "夏末站台上的重逢，旧歌单与未说出口的喜欢。只差一次勇敢，故事就会走向不同明天。",
        tags: ["恋爱", "青春", "治愈"], graph: eveningBreezeGraph, minutes: 10, endings: 3, plays: 31720, favorites: 10431, score: 9.7,
      },
    ];
    for (const sample of samples) {
      await this.database.query(
        `INSERT INTO stories (author_name, slug, title, summary, tags, visibility, status, graph, estimated_minutes, ending_count, play_count, favorite_count, score, published_at)
         VALUES ($1,$2,$3,$4,$5,'public','published',$6,$7,$8,$9,$10,$11,now()) ON CONFLICT (slug) DO NOTHING`,
        [sample.author, sample.slug, sample.title, sample.summary, sample.tags, JSON.stringify(sample.graph), sample.minutes, sample.endings, sample.plays, sample.favorites, sample.score],
      );
    }
  }
}
