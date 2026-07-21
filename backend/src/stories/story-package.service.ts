import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import type { StoryDetail, StoryGraph, StoryImportError, StoryImportReport, StoryMedia, StoryPackage, StoryPackageManifest, StorySummary } from "../../../shared/story-contract.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { DatabaseService } from "../database/database.service.js";
import { graphSchema } from "./story.validation.js";
import { ImageVariantService } from "./image-variant.service.js";

const PACKAGE_FORMAT = "interactive-story" as const;
const PACK_FORMAT = "interactive-story-pack" as const;
const MAX_PACKAGE_SIZE = 2 * 1024 * 1024 * 1024;
const MAX_UNPACKED_SIZE = 4 * 1024 * 1024 * 1024;
const MAX_ASSET_SIZE = { image: 20 * 1024 * 1024, audio: 100 * 1024 * 1024, video: 2 * 1024 * 1024 * 1024 } as const;
const MIME_BY_KIND = { image: /^image\//, audio: /^audio\//, video: /^video\// } as const;

interface ImportFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

interface AssetRow {
  id: string;
  story_id: string;
  kind: StoryMedia["kind"];
  original_name: string;
  mime_type: string;
  size: number;
  storage_key: string | null;
  source_url: string | null;
  sha256: string;
}

function withoutPlaybackUrl(media: StoryMedia): StoryMedia {
  const original = { ...media };
  delete original.playbackUrl;
  return original;
}

@Injectable()
export class StoryPackageService {
  private readonly storageRoot = resolve(process.env.STORAGE_LOCAL_DIR ?? join(process.cwd(), ".data", "story-assets"));

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService, @Inject(ImageVariantService) private readonly imageVariants: ImageVariantService) {}

  async validate(file: ImportFile): Promise<StoryImportReport> {
    try {
      const { packageData, warnings } = await this.readPackage(file);
      const report = this.validatePackage(packageData, warnings);
      return report;
    } catch (error) {
      return { valid: false, errors: [{ path: "file", code: "INVALID_FILE", message: error instanceof Error ? error.message : "无法读取剧情文件" }], warnings: [] };
    }
  }

  async importStory(file: ImportFile, user: AuthenticatedUser) {
    let packageData: StoryPackage;
    let warnings: string[];
    let binaryAssets: Map<string, Uint8Array>;
    try {
      ({ packageData, warnings, binaryAssets } = await this.readPackage(file));
    } catch (error) {
      throw new BadRequestException({ valid: false, errors: [{ path: "file", code: "INVALID_FILE", message: error instanceof Error ? error.message : "无法读取剧情文件" }], warnings: [] });
    }
    const report = this.validatePackage(packageData, warnings);
    if (!report.valid) throw new BadRequestException(report);

    const storedKeys: string[] = [];
    const variantJobs: Array<{ assetId: string; storyId: string; data: Uint8Array; mime: string }> = [];
    let imported: StorySummary & { graph: StoryGraph; importWarnings: string[] };
    try {
      imported = await this.database.transaction(async (client) => {
        const nodeMap = new Map<string, string>();
        const newNodes = packageData.story.graph.nodes.map((node) => {
          const id = randomUUID();
          nodeMap.set(node.id, id);
          return { ...node, id };
        });
        const assetMap = new Map<string, string>();
        for (const asset of packageData.assets) assetMap.set(asset.path ?? asset.url ?? asset.id, randomUUID());

        const graph: StoryGraph = {
          ...packageData.story.graph,
          startNodeId: nodeMap.get(packageData.story.graph.startNodeId)!,
          nodes: newNodes.map((node) => ({
            ...node,
            nextNodeId: node.nextNodeId ? nodeMap.get(node.nextNodeId) : undefined,
            choices: node.choices?.map((choice) => ({ ...choice, id: randomUUID(), targetNodeId: nodeMap.get(choice.targetNodeId)! })),
            media: node.media?.map((inputMedia) => {
              const media = withoutPlaybackUrl(inputMedia);
              return { ...media, url: this.mapMediaUrl(media.url, assetMap) };
            }),
          })),
        };
        const endingCount = graph.nodes.filter((node) => node.type === "ending").length;
        const slug = `story-${randomBytes(6).toString("hex")}`;
        const storyResult = await client.query<StorySummary & { graph: StoryGraph }>(
          `INSERT INTO stories (author_id, author_name, slug, title, summary, tags, visibility, status, graph, estimated_minutes, ending_count)
           VALUES ($1,$2,$3,$4,$5,$6,'private','draft',$7,$8,$9) RETURNING *`,
          [user.id, user.displayName, slug, packageData.story.title, packageData.story.summary, packageData.story.tags, JSON.stringify(graph), packageData.story.estimatedMinutes ?? 10, endingCount],
        );
        const storyId = storyResult.rows[0].id;
        for (const asset of packageData.assets) {
          const assetId = assetMap.get(asset.path ?? asset.url ?? asset.id)!;
          const binary = binaryAssets.get(asset.path ?? "");
          let storageKey: string | null = null;
          if (binary) {
            storageKey = `${storyId}/${assetId}${extname(asset.path ?? asset.originalName ?? "")}`;
            await this.store(storageKey, binary);
            storedKeys.push(storageKey);
          }
          await client.query(
            `INSERT INTO story_assets (id, story_id, kind, original_name, mime_type, size, storage_key, source_url, sha256)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [assetId, storyId, asset.kind, asset.originalName ?? basename(asset.path ?? asset.url ?? asset.id), asset.mime ?? "application/octet-stream", asset.size ?? binary?.byteLength ?? 0, storageKey, asset.url ?? null, asset.sha256 ?? (binary ? this.sha256(binary) : "")],
          );
          if (asset.kind === "image" && binary) variantJobs.push({ assetId, storyId, data: binary, mime: asset.mime ?? "application/octet-stream" });
        }
        return { ...storyResult.rows[0], graph, importWarnings: warnings };
      });
    } catch (error) {
      await Promise.all(storedKeys.map((key) => rm(join(this.storageRoot, key), { force: true }).catch(() => undefined)));
      throw error;
    }
    await Promise.all(variantJobs.map((job) => this.imageVariants.createPlayback(job.assetId, job.storyId, job.data, job.mime)));
    try { return { ...imported, graph: await this.imageVariants.enrichGraph(imported.graph) }; }
    catch { return imported; }
  }

  async exportStory(story: StoryDetail, format: "json" | "storypack") {
    const assets = await this.database.query<AssetRow>("SELECT * FROM story_assets WHERE story_id=$1 ORDER BY created_at", [story.id]);
    const exportGraph = structuredClone(story.graph);
    for (const node of exportGraph.nodes) node.media = node.media?.map(withoutPlaybackUrl);
    const packageData: StoryPackage = {
      format: PACKAGE_FORMAT,
      formatVersion: 1,
      story: { title: story.title, summary: story.summary, authorName: story.authorName, tags: story.tags, estimatedMinutes: story.estimatedMinutes, coverUrl: story.coverUrl, graph: exportGraph },
      assets: assets.rows.map((asset) => ({ id: asset.id, kind: asset.kind, url: asset.source_url ?? this.assetUrl(asset.id), mime: asset.mime_type, size: asset.size, sha256: asset.sha256, originalName: asset.original_name })),
    };
    if (format === "json") return { filename: `${this.safeName(story.title)}.story.json`, mime: "application/json; charset=utf-8", data: Buffer.from(JSON.stringify(packageData, null, 2), "utf8") };

    const files: Record<string, Uint8Array> = {};
    const manifestFiles: StoryPackageManifest["files"] = [];
    for (const asset of assets.rows) {
      const path = `assets/${asset.kind}/${this.safeName(asset.original_name || asset.id)}`;
      const bytes = asset.storage_key ? await readFile(join(this.storageRoot, asset.storage_key)) : await this.fetchExternal(asset.source_url);
      files[path] = bytes;
      manifestFiles.push({ id: asset.id, kind: asset.kind, path, mime: asset.mime_type, size: bytes.byteLength, sha256: this.sha256(bytes), originalName: asset.original_name });
    }
    const graph = structuredClone(exportGraph);
    for (const node of graph.nodes) node.media = node.media?.map((media) => {
      const asset = assets.rows.find((row) => media.url.endsWith(`/assets/${row.id}`) || media.url === row.source_url);
      const manifest = asset ? manifestFiles.find((item) => item.id === asset.id) : undefined;
      return manifest ? { ...media, url: manifest.path } : media;
    });
    const storyJson = { format: PACKAGE_FORMAT, formatVersion: 1 as const, story: { title: story.title, summary: story.summary, authorName: story.authorName, tags: story.tags, estimatedMinutes: story.estimatedMinutes, coverUrl: story.coverUrl, graph }, assets: manifestFiles } satisfies StoryPackage;
    files["story.json"] = strToU8(JSON.stringify(storyJson, null, 2));
    files["manifest.json"] = strToU8(JSON.stringify({ format: PACK_FORMAT, formatVersion: 1, files: manifestFiles }, null, 2));
    return { filename: `${this.safeName(story.title)}.storypack.zip`, mime: "application/zip", data: Buffer.from(zipSync(files, { level: 6 })) };
  }

  async readAsset(id: string) {
    const result = await this.database.query<AssetRow>("SELECT * FROM story_assets WHERE id=$1", [id]);
    const asset = result.rows[0];
    if (!asset) throw new NotFoundException("素材不存在");
    if (asset.storage_key) return { data: await readFile(join(this.storageRoot, asset.storage_key)), mime: asset.mime_type };
    if (asset.source_url) return { data: await this.fetchExternal(asset.source_url), mime: asset.mime_type };
    throw new NotFoundException("素材文件不可用");
  }

  private async readPackage(file: ImportFile) {
    if (!file || file.size > MAX_PACKAGE_SIZE) throw new Error("文件超过 2GB 限制");
    const input = file.buffer ?? (file.path ? await readFile(file.path) : undefined);
    if (!input) throw new Error("文件内容为空");
    if (file.originalname.endsWith(".story.json") || file.mimetype === "application/json") return { packageData: JSON.parse(input.toString("utf8")) as StoryPackage, warnings: [], binaryAssets: new Map<string, Uint8Array>() };
    if (!file.originalname.endsWith(".storypack.zip") && file.mimetype !== "application/zip" && file.mimetype !== "application/x-zip-compressed") throw new Error("仅支持 .story.json 或 .storypack.zip");
    const entries = unzipSync(input);
    const binaryAssets = new Map<string, Uint8Array>();
    let unpackedSize = 0;
    for (const [path, bytes] of Object.entries(entries)) {
      if (!this.safePath(path) || path.startsWith("/")) throw new Error(`非法压缩包路径：${path}`);
      unpackedSize += bytes.byteLength;
      if (unpackedSize > MAX_UNPACKED_SIZE) throw new Error("压缩包解压后超过大小限制");
      if (path.startsWith("assets/")) binaryAssets.set(path, bytes);
    }
    const packageData = JSON.parse(strFromU8(entries["story.json"] ?? new Uint8Array())) as StoryPackage;
    return { packageData, warnings: [], binaryAssets };
  }

  private validatePackage(packageData: StoryPackage, warnings: string[]): StoryImportReport {
    const errors: StoryImportError[] = [];
    if (!packageData || packageData.format !== PACKAGE_FORMAT || packageData.formatVersion !== 1) errors.push({ path: "format", code: "UNSUPPORTED_FORMAT", message: "不支持的剧情文件格式或版本" });
    const graphResult = graphSchema.safeParse(packageData?.story?.graph);
    if (!graphResult.success) for (const issue of graphResult.error.issues) errors.push({ path: issue.path.join("."), code: "INVALID_GRAPH", message: issue.message });
    const nodes = packageData?.story?.graph?.nodes ?? [];
    const variables = packageData?.story?.graph?.variables ?? [];
    const variableKeys = new Set(variables.map((variable) => variable.key));
    const assets = packageData?.assets ?? [];
    const assetKeys = new Set(assets.map((asset) => asset.path ?? asset.url ?? asset.id));
    for (const node of nodes) {
      for (const choice of node.choices ?? []) for (const change of choice.changes ?? []) if (!variableKeys.has(change.key)) errors.push({ path: `nodes.${node.id}.choices.${choice.id}.changes`, code: "UNKNOWN_VARIABLE", message: `变量不存在：${change.key}` });
      for (const media of node.media ?? []) if (!assetKeys.has(media.url) && !/^https?:\/\//i.test(media.url)) errors.push({ path: `nodes.${node.id}.media`, code: "MISSING_ASSET", message: `素材不存在：${media.url}` });
    }
    for (const asset of assets) {
      const max = MAX_ASSET_SIZE[asset.kind];
      if ((asset.size ?? 0) > max) errors.push({ path: `assets.${asset.id}`, code: "ASSET_TOO_LARGE", message: `${asset.kind} 素材超过大小限制` });
      if (asset.path && (!this.safePath(asset.path) || !asset.path.startsWith("assets/"))) errors.push({ path: `assets.${asset.id}.path`, code: "INVALID_ASSET_PATH", message: "素材路径不合法" });
      if (!asset.url && !asset.path) errors.push({ path: `assets.${asset.id}`, code: "MISSING_ASSET_SOURCE", message: "素材缺少 URL 或包内路径" });
      if (asset.mime && !MIME_BY_KIND[asset.kind].test(asset.mime)) errors.push({ path: `assets.${asset.id}.mime`, code: "INVALID_MIME", message: "素材类型与 MIME 不匹配" });
    }
    const title = packageData?.story?.title;
    const report: StoryImportReport = { valid: errors.length === 0, errors, warnings, story: { title: title ?? "", summary: packageData?.story?.summary ?? "", authorName: packageData?.story?.authorName, tags: packageData?.story?.tags ?? [], estimatedMinutes: packageData?.story?.estimatedMinutes, nodeCount: nodes.length, variableCount: variables.length, endingCount: nodes.filter((node) => node.type === "ending").length, assetCount: assets.length, totalSize: assets.reduce((sum, asset) => sum + (asset.size ?? 0), 0) } };
    return report;
  }

  private mapMediaUrl(url: string, assetMap: Map<string, string>) { const id = assetMap.get(url); return id ? this.assetUrl(id) : url; }
  private assetUrl(id: string) { return `/api/stories/assets/${id}`; }
  private safePath(path: string) { return !path.includes("\\") && !path.split("/").some((part) => part === ".." || part === "."); }
  private safeName(name: string) { return name.replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(0, 100) || "story"; }
  private sha256(data: Uint8Array) { return createHash("sha256").update(data).digest("hex"); }
  private async store(key: string, data: Uint8Array) { const target = join(this.storageRoot, key); await mkdir(resolve(target, ".."), { recursive: true }); await writeFile(target, data); }
  private async fetchExternal(url: string | null) { if (!url) throw new Error("外部素材 URL 为空"); const response = await fetch(url); if (!response.ok) throw new Error(`无法下载素材：${url}`); return new Uint8Array(await response.arrayBuffer()); }
}
