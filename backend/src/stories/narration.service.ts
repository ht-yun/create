import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { StoryGraph, StoryMedia, StoryNode } from "../../../shared/story-contract.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { DatabaseService } from "../database/database.service.js";
import { OpenAiCompatibleNarrationProvider } from "./narration-provider.js";

type JobStatus = "queued" | "processing" | "completed" | "failed";

interface StoryOwnerRow {
  id: string;
  author_id: string | null;
  graph: StoryGraph;
}

export interface GenerateOptions {
  nodeIds?: string[];
  voiceId?: string;
  speed?: number;
  volume?: number;
}

@Injectable()
export class NarrationService {
  private readonly storageRoot: string;

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(ConfigService) config: ConfigService,
    @Inject(OpenAiCompatibleNarrationProvider) private readonly provider: OpenAiCompatibleNarrationProvider,
  ) {
    this.storageRoot = resolve(config.get("STORAGE_LOCAL_DIR", join(process.cwd(), ".data", "story-assets")));
  }

  async createJob(storyId: string, user: AuthenticatedUser, options: GenerateOptions = {}) {
    if (!this.provider.isConfigured()) throw new ServiceUnavailableException("请先在后端配置 TTS_API_KEY");
    const story = await this.getOwnedStory(storyId, user);
    const requestedIds = options.nodeIds?.length ? new Set(options.nodeIds) : undefined;
    const nodes = story.graph.nodes.filter((node) =>
      node.type !== "condition" &&
      node.content.trim().length > 0 &&
      (!requestedIds || requestedIds.has(node.id)),
    );
    if (requestedIds && nodes.length !== requestedIds.size) throw new BadRequestException("部分旁白节点不存在、没有正文或属于条件节点");
    if (!nodes.length) throw new BadRequestException("没有可以生成旁白的剧情节点");

    const voiceId = cleanVoiceId(options.voiceId ?? "alloy");
    const speed = clamp(options.speed ?? 1, 0.5, 2);
    const volume = clamp(options.volume ?? 1, 0, 1);
    const jobId = randomUUID();
    await this.database.transaction(async (client) => {
      await client.query(
        `INSERT INTO story_narration_settings (story_id, voice_id, speed, volume)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (story_id) DO UPDATE SET voice_id=EXCLUDED.voice_id, speed=EXCLUDED.speed,
         volume=EXCLUDED.volume, updated_at=now()`,
        [story.id, voiceId, speed, volume],
      );
      await client.query(
        `INSERT INTO story_narration_jobs (id, story_id, author_id, provider, voice_id, speed, volume, status, total_nodes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'queued',$8)`,
        [jobId, story.id, user.id, this.provider.name, voiceId, speed, volume, nodes.length],
      );
    });

    void this.runJob(jobId, story, nodes, { voiceId, speed, volume }).catch(async (error) => {
      await this.database.query(
        "UPDATE story_narration_jobs SET status='failed', error_message=$2, finished_at=now(), updated_at=now() WHERE id=$1",
        [jobId, errorMessage(error)],
      ).catch(() => undefined);
    });
    return { jobId, status: "queued" as JobStatus, totalNodes: nodes.length };
  }

  async getJob(storyId: string, jobId: string, user: AuthenticatedUser) {
    await this.getOwnedStory(storyId, user);
    const result = await this.database.query(
      `SELECT id, status, total_nodes AS "totalNodes", completed_nodes AS "completedNodes",
       failed_nodes AS "failedNodes", error_message AS "errorMessage", created_at AS "createdAt",
       started_at AS "startedAt", finished_at AS "finishedAt"
       FROM story_narration_jobs WHERE id=$1 AND story_id=$2`,
      [jobId, storyId],
    );
    if (!result.rows[0]) throw new NotFoundException("旁白生成任务不存在");
    return result.rows[0];
  }

  async getStatus(storyId: string, user: AuthenticatedUser) {
    const story = await this.getOwnedStory(storyId, user);
    const [settings, narrations] = await Promise.all([
      this.database.query("SELECT voice_id AS \"voiceId\", speed, volume FROM story_narration_settings WHERE story_id=$1", [storyId]),
      this.database.query<{
        node_id: string;
        text_hash: string;
        status: string;
        error_message: string | null;
        updated_at: Date;
      }>("SELECT node_id, text_hash, status, error_message, updated_at FROM story_narrations WHERE story_id=$1", [storyId]),
    ]);
    const byNode = new Map(narrations.rows.map((item) => [item.node_id, item]));
    return {
      configured: this.provider.isConfigured(),
      provider: this.provider.name,
      settings: settings.rows[0] ?? { voiceId: "alloy", speed: 1, volume: 1 },
      nodes: story.graph.nodes.filter((node) => node.type !== "condition").map((node) => {
        const generated = byNode.get(node.id);
        const manualVoice = !generated && node.media?.some((media) => media.kind === "audio" && media.role === "voice");
        const hash = narrationHash(node.content);
        return {
          nodeId: node.id,
          title: node.title,
          status: manualVoice ? "manual" : !generated ? "missing" : generated.text_hash === hash ? generated.status : "stale",
          errorMessage: generated?.error_message ?? undefined,
          updatedAt: generated?.updated_at?.toISOString(),
        };
      }),
    };
  }

  private async runJob(
    jobId: string,
    story: StoryOwnerRow,
    nodes: StoryNode[],
    settings: { voiceId: string; speed: number; volume: number },
  ) {
    await this.database.query("UPDATE story_narration_jobs SET status='processing', started_at=now(), updated_at=now() WHERE id=$1", [jobId]);
    let completed = 0;
    let failed = 0;
    for (const node of nodes) {
      try {
        await this.generateNode(story.id, node, settings);
        completed += 1;
      } catch (error) {
        failed += 1;
        await this.database.query(
          `INSERT INTO story_narrations (story_id, node_id, text_hash, provider, voice_id, speed, status, error_message)
           VALUES ($1,$2,$3,$4,$5,$6,'failed',$7)
           ON CONFLICT (story_id,node_id) DO UPDATE SET text_hash=EXCLUDED.text_hash, provider=EXCLUDED.provider,
           voice_id=EXCLUDED.voice_id, speed=EXCLUDED.speed, status='failed', error_message=EXCLUDED.error_message, updated_at=now()`,
          [story.id, node.id, narrationHash(node.content), this.provider.name, settings.voiceId, settings.speed, errorMessage(error)],
        );
      }
      await this.database.query(
        "UPDATE story_narration_jobs SET completed_nodes=$2, failed_nodes=$3, updated_at=now() WHERE id=$1",
        [jobId, completed, failed],
      );
    }
    await this.database.query(
      `UPDATE story_narration_jobs SET status=$2, completed_nodes=$3, failed_nodes=$4,
       error_message=$5, finished_at=now(), updated_at=now() WHERE id=$1`,
      [jobId, failed ? "failed" : "completed", completed, failed, failed ? `${failed} 个节点生成失败，可单独重试` : null],
    );
  }

  private async generateNode(
    storyId: string,
    node: StoryNode,
    settings: { voiceId: string; speed: number; volume: number },
  ) {
    const previous = await this.database.query<{ asset_id: string | null }>(
      "SELECT asset_id FROM story_narrations WHERE story_id=$1 AND node_id=$2",
      [storyId, node.id],
    );
    if (!previous.rows[0] && node.media?.some((media) => media.kind === "audio" && media.role === "voice")) return;

    const result = await this.provider.synthesize({ text: node.content, voiceId: settings.voiceId, speed: settings.speed });
    if (result.audio.byteLength > 100 * 1024 * 1024) throw new BadRequestException("生成的旁白音频超过 100MB");
    const assetId = randomUUID();
    const storageKey = `${storyId}/${assetId}.narration.mp3`;
    const target = join(this.storageRoot, storageKey);
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, result.audio);
    const newUrl = `/api/stories/assets/${assetId}`;
    const oldAssetId = previous.rows[0]?.asset_id;
    const oldUrl = oldAssetId ? `/api/stories/assets/${oldAssetId}` : undefined;

    try {
      await this.database.transaction(async (client) => {
        const current = await client.query<{ graph: StoryGraph }>("SELECT graph FROM stories WHERE id=$1 FOR UPDATE", [storyId]);
        if (!current.rows[0]) throw new NotFoundException("作品不存在");
        const graph = current.rows[0].graph;
        const nextGraph: StoryGraph = {
          ...graph,
          nodes: graph.nodes.map((item) => item.id !== node.id ? item : {
            ...item,
            media: [
              ...(item.media ?? []).filter((media) => media.url !== oldUrl),
              {
                kind: "audio",
                role: "voice",
                url: newUrl,
                loop: false,
                volume: settings.volume,
              } satisfies StoryMedia,
            ],
          }),
        };
        await client.query(
          `INSERT INTO story_assets (id, story_id, kind, original_name, mime_type, size, storage_key, sha256)
           VALUES ($1,$2,'audio',$3,$4,$5,$6,$7)`,
          [assetId, storyId, `${node.id}-narration.mp3`, result.mimeType, result.audio.byteLength, storageKey, sha256(result.audio)],
        );
        await client.query(
          `INSERT INTO story_narrations (story_id, node_id, text_hash, provider, voice_id, speed, asset_id, status, duration_ms, error_message)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'ready',$8,NULL)
           ON CONFLICT (story_id,node_id) DO UPDATE SET text_hash=EXCLUDED.text_hash, provider=EXCLUDED.provider,
           voice_id=EXCLUDED.voice_id, speed=EXCLUDED.speed, asset_id=EXCLUDED.asset_id, status='ready',
           duration_ms=EXCLUDED.duration_ms, error_message=NULL, updated_at=now()`,
          [storyId, node.id, narrationHash(node.content), this.provider.name, settings.voiceId, settings.speed, assetId, result.durationMs ?? null],
        );
        await client.query("UPDATE stories SET graph=$2, updated_at=now() WHERE id=$1", [storyId, JSON.stringify(nextGraph)]);
        if (oldAssetId) await client.query("DELETE FROM story_assets WHERE id=$1", [oldAssetId]);
      });
    } catch (error) {
      await rm(target, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  private async getOwnedStory(storyId: string, user: AuthenticatedUser) {
    const result = await this.database.query<StoryOwnerRow>("SELECT id, author_id, graph FROM stories WHERE id=$1", [storyId]);
    const story = result.rows[0];
    if (!story) throw new NotFoundException("作品不存在");
    if (story.author_id !== user.id) throw new ForbiddenException("你不能修改该作品");
    return story;
  }
}

function narrationHash(text: string) {
  return createHash("sha256").update(text.trim().replace(/\r\n/g, "\n")).digest("hex");
}

function sha256(data: Uint8Array) {
  return createHash("sha256").update(data).digest("hex");
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function cleanVoiceId(value: string) {
  const voice = value.trim();
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(voice)) throw new BadRequestException("旁白音色标识无效");
  return voice;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "AI 旁白生成失败";
}
