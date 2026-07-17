import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type { StoryDetail, StoryGraph, StoryStatus, StorySummary, StoryVisibility } from "../../../shared/story-contract.js";
import { DatabaseService } from "../database/database.service.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { createStorySchema, updateStorySchema } from "./story.validation.js";

interface StoryRow {
  id: string;
  author_id: string | null;
  author_name: string;
  slug: string;
  title: string;
  summary: string;
  cover_url: string | null;
  tags: string[];
  visibility: StoryVisibility;
  status: StoryStatus;
  graph: StoryGraph;
  estimated_minutes: number;
  ending_count: number;
  favorite_count: number;
  play_count: number;
  score: string | number;
  updated_at: Date;
}

@Injectable()
export class StoriesService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listPublic(search = "", sort: "popular" | "latest" | "score" = "popular") {
    const order = sort === "latest" ? "published_at DESC NULLS LAST" : sort === "score" ? "score DESC, play_count DESC" : "play_count DESC, favorite_count DESC";
    const result = await this.database.query<StoryRow>(
      `SELECT * FROM stories
       WHERE status = 'published' AND visibility = 'public'
         AND ($1 = '' OR title ILIKE '%' || $1 || '%' OR summary ILIKE '%' || $1 || '%' OR $1 = ANY(tags))
       ORDER BY ${order} LIMIT 60`,
      [search.trim()],
    );
    return result.rows.map((row) => this.toSummary(row));
  }

  async getBySlug(slug: string, viewer?: AuthenticatedUser | null): Promise<StoryDetail> {
    const result = await this.database.query<StoryRow>("SELECT * FROM stories WHERE slug = $1", [slug]);
    const row = result.rows[0];
    if (!row) throw new NotFoundException("作品不存在");
    const isOwner = viewer?.id === row.author_id;
    if (row.visibility === "private" && !isOwner) throw new NotFoundException("作品不存在");
    if (row.status !== "published" && !isOwner) throw new NotFoundException("作品不存在");
    return { ...this.toSummary(row), graph: row.graph };
  }

  async listMine(user: AuthenticatedUser) {
    const result = await this.database.query<StoryRow>("SELECT * FROM stories WHERE author_id = $1 ORDER BY updated_at DESC", [user.id]);
    return result.rows.map((row) => this.toSummary(row));
  }

  async create(input: unknown, user: AuthenticatedUser) {
    const parsed = createStorySchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message);
    const slug = `story-${randomBytes(6).toString("hex")}`;
    const endingCount = parsed.data.graph.nodes.filter((node) => node.type === "ending").length;
    const result = await this.database.query<StoryRow>(
      `INSERT INTO stories (author_id, author_name, slug, title, summary, tags, visibility, graph, ending_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [user.id, user.displayName, slug, parsed.data.title, parsed.data.summary, parsed.data.tags, parsed.data.visibility, JSON.stringify(parsed.data.graph), endingCount],
    );
    return { ...this.toSummary(result.rows[0]), graph: result.rows[0].graph };
  }

  async update(id: string, input: unknown, user: AuthenticatedUser) {
    const parsed = updateStorySchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message);
    const current = await this.database.query<StoryRow>("SELECT * FROM stories WHERE id = $1", [id]);
    const row = current.rows[0];
    if (!row) throw new NotFoundException("作品不存在");
    if (row.author_id !== user.id) throw new ForbiddenException("你不能编辑该作品");

    const next = { ...row, ...parsed.data };
    const endingCount = next.graph.nodes.filter((node) => node.type === "ending").length;
    if (next.status === "published" && endingCount === 0) throw new BadRequestException("发布前至少需要一个结局");
    const result = await this.database.query<StoryRow>(
      `UPDATE stories SET title=$2, summary=$3, tags=$4, visibility=$5, status=$6, graph=$7,
       ending_count=$8, published_at=CASE WHEN $6='published' THEN COALESCE(published_at, now()) ELSE published_at END,
       updated_at=now() WHERE id=$1 RETURNING *`,
      [id, next.title, next.summary, next.tags, next.visibility, next.status, JSON.stringify(next.graph), endingCount],
    );
    return { ...this.toSummary(result.rows[0]), graph: result.rows[0].graph };
  }

  async toggleFavorite(slug: string, user: AuthenticatedUser) {
    return this.database.transaction(async (client) => {
      const story = await client.query<{ id: string }>("SELECT id FROM stories WHERE slug = $1 AND status='published' AND visibility <> 'private'", [slug]);
      if (!story.rows[0]) throw new NotFoundException("作品不存在");
      const removed = await client.query("DELETE FROM favorites WHERE user_id=$1 AND story_id=$2 RETURNING story_id", [user.id, story.rows[0].id]);
      if (removed.rowCount) {
        await client.query("UPDATE stories SET favorite_count=GREATEST(favorite_count-1,0) WHERE id=$1", [story.rows[0].id]);
        return { favorited: false };
      }
      try {
        await client.query("INSERT INTO favorites (user_id, story_id) VALUES ($1,$2)", [user.id, story.rows[0].id]);
      } catch {
        throw new ConflictException("收藏状态更新失败");
      }
      await client.query("UPDATE stories SET favorite_count=favorite_count+1 WHERE id=$1", [story.rows[0].id]);
      return { favorited: true };
    });
  }

  async listFavorites(user: AuthenticatedUser) {
    const result = await this.database.query<StoryRow>(
      `SELECT s.* FROM favorites f JOIN stories s ON s.id=f.story_id
       WHERE f.user_id=$1 AND s.status='published' ORDER BY f.created_at DESC`,
      [user.id],
    );
    return result.rows.map((row) => this.toSummary(row));
  }

  private toSummary(row: StoryRow): StorySummary {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      authorName: row.author_name,
      coverUrl: row.cover_url ?? undefined,
      tags: row.tags,
      visibility: row.visibility,
      status: row.status,
      estimatedMinutes: row.estimated_minutes,
      endingCount: row.ending_count,
      favoriteCount: row.favorite_count,
      playCount: row.play_count,
      score: Number(row.score),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
