import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Storyloom home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>折枝 · 互动叙事<\/title>/);
  assert.match(html, /创意工坊/);
  assert.match(html, /我的仓库/);
  assert.match(html, /雨夜来客/);
  assert.match(html, /开始剧情/);
  assert.match(html, /href="\/stories\/rain-night-visitor"/);
  assert.match(html, /href="\/auth\?returnTo=%2Fstories%2Frain-night-visitor"/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/);
});

test("server-renders the playable demo without a running API", async () => {
  const response = await render("/stories/rain-night-visitor");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /雨夜叩门/);
  assert.match(html, /打开门，让他进来/);
  assert.match(html, /走过的分支/);
  assert.match(html, /immersive-player/);
  assert.match(html, /cinematic-dialogue/);
  assert.match(html, /点击显示全部/);
  assert.doesNotMatch(html, /narrative-card/);
});

test("keeps immersive presentation fields optional and package-compatible", async () => {
  const contract = await readFile(new URL("../shared/story-contract.ts", import.meta.url), "utf8");
  assert.match(contract, /feedback\?: string/);
  assert.match(contract, /importance\?: "normal" \| "key"/);
  assert.match(contract, /focalPoint\?: \{ x: number; y: number \}/);
  assert.match(contract, /playbackUrl\?: string/);
  assert.match(contract, /presentation\?:/);
});

test("keeps immersive controls recoverable and progress media-aware", async () => {
  const player = await readFile(new URL("../components/story-player.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(player, /distanceToEnding/);
  assert.match(player, /prepareFrame\(savedNode, saved\.mediaIndex \?\? 0\)/);
  assert.match(player, /mediaTimes\?: Record<string, number>/);
  assert.match(player, /role="dialog" aria-modal="true"/);
  assert.match(player, /aria-label="减小字号"/);
  assert.doesNotMatch(player, /feedbackText\.length \* 90|: 500/);
  assert.match(player, /preferences\.reducedMotion \? 0 : 100/);
  assert.match(player, /className="transition-feedback"/);
  assert.match(styles, /@media\(max-width:430px\)\{\.immersive-toolbar nav button:nth-child\(1\)\{display:grid\}\}/);
  assert.match(styles, /drawer-scrim/);
});

test("keeps scene transitions decoded, double-buffered, and backward compatible", async () => {
  const player = await readFile(new URL("../components/story-player.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(player, /image\.decode\(\)/);
  assert.match(player, /window\.setTimeout\(\(\) => finish\(false\), 3000\)/);
  assert.match(player, /if \(!ready && readyImageCacheRef\.current\.get\(url\) === readiness\) readyImageCacheRef\.current\.delete\(url\)/);
  assert.match(player, /Promise\.race\(\[posterReadiness, videoReadiness\]\)/);
  assert.match(player, /setOutgoingFrame\(previous\)/);
  assert.match(player, /style: targetNode\.presentation\?\.transition \?\? "dissolve"/);
  assert.match(player, /if \(kind === "gallery"\) return 420/);
  assert.match(player, /style === "fade" \? 520 : 800/);
  assert.match(player, /queuedGalleryRef/);
  assert.match(player, /const urls = choices\.map/);
  assert.match(player, /const adjacent = \[visualMedia/);
  assert.match(player, /media\.playbackUrl \?\? media\.url/);
  assert.match(styles, /scene-transition-node\.scene-transition-dissolve/);
  assert.match(styles, /scene-transition-gallery/);
  assert.match(styles, /scene-transition-node \.scene-frame-outgoing,.scene-transition-gallery \.scene-frame-outgoing\{opacity:1\}/);
  assert.match(styles, /translateX\(calc\(var\(--scene-direction\) \* 12px\)\)/);
});

test("ships lightweight playback images while preserving originals", async () => {
  const originalDirectory = new URL("../public/story-assets/evening-breeze/", import.meta.url);
  const playbackDirectory = new URL("../public/story-assets/optimized/evening-breeze/", import.meta.url);
  const originals = (await readdir(originalDirectory)).filter((name) => name.endsWith(".png"));
  const playback = (await readdir(playbackDirectory)).filter((name) => name.endsWith(".webp"));
  assert.equal(playback.length, originals.length);
  const originalBytes = (await Promise.all(originals.map(async (name) => (await stat(new URL(name, originalDirectory))).size))).reduce((sum, size) => sum + size, 0);
  const playbackBytes = (await Promise.all(playback.map(async (name) => (await stat(new URL(name, playbackDirectory))).size))).reduce((sum, size) => sum + size, 0);
  assert.ok(playbackBytes < originalBytes * 0.25);
  const packageService = await readFile(new URL("../backend/src/stories/story-package.service.ts", import.meta.url), "utf8");
  assert.match(packageService, /delete original\.playbackUrl/);
});

test("binds the mist-catch story to its scene and ending images", async () => {
  const story = await readFile(new URL("../lib/mist-catch-story.ts", import.meta.url), "utf8");
  assert.equal((story.match(/media: sceneMedia\(/g) ?? []).length, 30);
  assert.match(story, /N01 雨夜失窃\.png/);
  assert.match(story, /N25 最后一盏灯\.png/);
  assert.match(story, /E05 码头边的救援\.png/);
  await access(new URL("../public/story-assets/mist-catch/N01%20%E9%9B%A8%E5%A4%9C%E5%A4%B1%E7%AA%83.png", import.meta.url));
  await access(new URL("../public/story-assets/optimized/mist-catch/N01%20%E9%9B%A8%E5%A4%9C%E5%A4%B1%E7%AA%83.webp", import.meta.url));
});

test("contains the planned product routes and no disposable preview", async () => {
  const files = [
    "../app/workshop/page.tsx", "../app/rankings/page.tsx", "../app/auth/page.tsx",
    "../app/studio/page.tsx", "../app/studio/editor/page.tsx", "../app/stories/[slug]/page.tsx",
  ];
  await Promise.all(files.map((file) => access(new URL(file, import.meta.url))));
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);
});
