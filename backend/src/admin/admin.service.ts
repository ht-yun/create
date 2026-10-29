import { Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class AdminService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async overview() {
    const [counts, activity, recentUsers, recentStories, recentPosts] = await Promise.all([
      this.database.query<{
        total_users: string;
        verified_users: string;
        active_users: string;
        total_stories: string;
        published_stories: string;
        draft_stories: string;
        total_plays: string;
        total_favorites: string;
        total_posts: string;
        total_comments: string;
      }>(`SELECT
          (SELECT count(*) FROM users) AS total_users,
          (SELECT count(*) FROM users WHERE email_verified_at IS NOT NULL) AS verified_users,
          (SELECT count(DISTINCT user_id) FROM sessions WHERE last_seen_at > now() - interval '30 days') AS active_users,
          (SELECT count(*) FROM stories) AS total_stories,
          (SELECT count(*) FROM stories WHERE status = 'published' AND visibility = 'public') AS published_stories,
          (SELECT count(*) FROM stories WHERE status = 'draft') AS draft_stories,
          (SELECT coalesce(sum(play_count), 0) FROM stories) AS total_plays,
          (SELECT coalesce(sum(favorite_count), 0) FROM stories) AS total_favorites,
          (SELECT count(*) FROM community_posts WHERE status = 'published') AS total_posts,
          (SELECT count(*) FROM community_comments WHERE status = 'published') AS total_comments`),
      this.database.query<{ day: string; users: string; stories: string; posts: string }>(`WITH days AS (
          SELECT generate_series(current_date - interval '6 days', current_date, interval '1 day')::date AS day
        )
        SELECT
          to_char(days.day, 'MM-DD') AS day,
          (SELECT count(*) FROM users u WHERE u.created_at::date = days.day) AS users,
          (SELECT count(*) FROM stories s WHERE s.created_at::date = days.day) AS stories,
          (SELECT count(*) FROM community_posts p WHERE p.created_at::date = days.day) AS posts
        FROM days ORDER BY days.day`),
      this.database.query(`SELECT id, email, display_name, role, email_verified_at, created_at
        FROM users ORDER BY created_at DESC LIMIT 6`),
      this.database.query(`SELECT id, slug, title, author_name, status, visibility, play_count, favorite_count, created_at
        FROM stories ORDER BY updated_at DESC LIMIT 6`),
      this.database.query(`SELECT p.id, p.title, p.kind, p.status, p.likes_count, p.created_at,
          coalesce(u.display_name, '已注销用户') AS author_name,
          count(c.id)::int AS comment_count
        FROM community_posts p
        LEFT JOIN users u ON u.id = p.author_id
        LEFT JOIN community_comments c ON c.post_id = p.id AND c.status = 'published'
        GROUP BY p.id, u.display_name
        ORDER BY p.created_at DESC LIMIT 6`),
    ]);

    const row = counts.rows[0];
    return {
      metrics: {
        totalUsers: Number(row.total_users),
        verifiedUsers: Number(row.verified_users),
        activeUsers: Number(row.active_users),
        totalStories: Number(row.total_stories),
        publishedStories: Number(row.published_stories),
        draftStories: Number(row.draft_stories),
        totalPlays: Number(row.total_plays),
        totalFavorites: Number(row.total_favorites),
        totalPosts: Number(row.total_posts),
        totalComments: Number(row.total_comments),
      },
      activity: activity.rows.map((item) => ({
        day: item.day,
        users: Number(item.users),
        stories: Number(item.stories),
        posts: Number(item.posts),
      })),
      recentUsers: recentUsers.rows,
      recentStories: recentStories.rows,
      recentPosts: recentPosts.rows,
    };
  }

  async users(search?: string) {
    const value = search?.trim();
    const result = await this.database.query(
      `SELECT id, email, display_name, role, email_verified_at, created_at, updated_at
       FROM users
       WHERE ($1 = '' OR email ILIKE '%' || $1 || '%' OR display_name ILIKE '%' || $1 || '%')
       ORDER BY created_at DESC LIMIT 100`,
      [value ?? ""],
    );
    return { users: result.rows };
  }

  async stories(status?: string) {
    const result = await this.database.query(
      `SELECT id, slug, title, author_name, status, visibility, play_count, favorite_count, score, created_at, updated_at
       FROM stories
       WHERE ($1 = '' OR status = $1)
       ORDER BY updated_at DESC LIMIT 100`,
      [status ?? ""],
    );
    return { stories: result.rows };
  }

  async posts() {
    const result = await this.database.query(`SELECT p.id, p.title, p.body, p.kind, p.status, p.likes_count, p.created_at,
        coalesce(u.display_name, '已注销用户') AS author_name,
        count(c.id)::int AS comment_count
      FROM community_posts p
      LEFT JOIN users u ON u.id = p.author_id
      LEFT JOIN community_comments c ON c.post_id = p.id AND c.status = 'published'
      GROUP BY p.id, u.display_name
      ORDER BY p.created_at DESC LIMIT 100`);
    return { posts: result.rows };
  }
}
