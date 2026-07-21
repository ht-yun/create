import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import type { StoryGraph } from "../../../shared/story-contract.js";
import { DatabaseService } from "../database/database.service.js";

interface VariantRow {
  storage_key: string | null;
  mime_type: string;
  status: "pending" | "ready" | "failed";
}

@Injectable()
export class ImageVariantService {
  private readonly storageRoot = resolve(process.env.STORAGE_LOCAL_DIR ?? join(process.cwd(), ".data", "story-assets"));
  private readonly supportedMime = new Set(["image/png", "image/jpeg", "image/webp", "image/avif", "image/tiff"]);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  playbackUrl(assetId: string) {
    return `/api/stories/assets/${assetId}/playback`;
  }

  async createPlayback(assetId: string, storyId: string, data: Uint8Array, mime: string) {
    if (!this.supportedMime.has(mime.toLowerCase())) return undefined;
    const storageKey = `${storyId}/${assetId}.playback.webp`;
    try {
      const { data: output, info } = await sharp(Buffer.from(data), { failOn: "error" })
        .rotate()
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      const target = join(this.storageRoot, storageKey);
      await mkdir(resolve(target, ".."), { recursive: true });
      await writeFile(target, output);
      await this.database.query(
        `INSERT INTO story_asset_variants (asset_id, purpose, mime_type, width, height, size, storage_key, status)
         VALUES ($1,'playback','image/webp',$2,$3,$4,$5,'ready')
         ON CONFLICT (asset_id, purpose) DO UPDATE SET mime_type=EXCLUDED.mime_type, width=EXCLUDED.width,
         height=EXCLUDED.height, size=EXCLUDED.size, storage_key=EXCLUDED.storage_key, status='ready', error_message=NULL`,
        [assetId, info.width, info.height, output.byteLength, storageKey],
      );
      return storageKey;
    } catch (error) {
      await this.database.query(
        `INSERT INTO story_asset_variants (asset_id, purpose, mime_type, status, error_message)
         VALUES ($1,'playback','image/webp','failed',$2)
         ON CONFLICT (asset_id, purpose) DO UPDATE SET status='failed', error_message=EXCLUDED.error_message`,
        [assetId, error instanceof Error ? error.message.slice(0, 500) : "图片处理失败"],
      );
      return undefined;
    }
  }

  async readPlayback(assetId: string) {
    const result = await this.database.query<VariantRow>(
      "SELECT storage_key, mime_type, status FROM story_asset_variants WHERE asset_id=$1 AND purpose='playback'",
      [assetId],
    );
    const variant = result.rows[0];
    if (!variant || variant.status !== "ready" || !variant.storage_key) throw new NotFoundException("播放版本不可用");
    return { data: await readFile(join(this.storageRoot, variant.storage_key)), mime: variant.mime_type };
  }

  async enrichGraph(graph: StoryGraph) {
    const assetIds = new Set<string>();
    for (const node of graph.nodes) for (const media of node.media ?? []) {
      const match = media.url.match(/^\/api\/stories\/assets\/([0-9a-f-]{36})$/i);
      if (media.kind === "image" && match) assetIds.add(match[1]);
    }
    if (!assetIds.size) return graph;
    const result = await this.database.query<{ asset_id: string }>(
      "SELECT asset_id FROM story_asset_variants WHERE purpose='playback' AND status='ready' AND asset_id = ANY($1::uuid[])",
      [[...assetIds]],
    );
    const ready = new Set(result.rows.map((row) => row.asset_id));
    if (!ready.size) return graph;
    return {
      ...graph,
      nodes: graph.nodes.map((node) => ({
        ...node,
        media: node.media?.map((media) => {
          const match = media.url.match(/^\/api\/stories\/assets\/([0-9a-f-]{36})$/i);
          return media.kind === "image" && match && ready.has(match[1]) ? { ...media, playbackUrl: this.playbackUrl(match[1]) } : media;
        }),
      })),
    };
  }
}
