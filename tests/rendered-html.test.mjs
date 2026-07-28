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
  assert.doesNotMatch(player, /preferences\.reducedMotion \? 0 : 100/);
  assert.match(player, /isInterlude = current\?\.type === "scene" && !choices\.length/);
  assert.match(player, /interludeTimerRef/);
  assert.match(player, /frameDuration = preferences\.reducedMotion \? 0 : 3000/);
  assert.match(player, /activeFrameRef\.current\?\.mediaIndex \?\? 0/);
  assert.match(player, /choices\.length > 0/);
  assert.match(player, /className="transition-feedback"/);
  assert.match(styles, /@media\(max-width:430px\)\{\.immersive-toolbar nav button:nth-child\(1\)\{display:grid\}\}/);
  assert.match(styles, /drawer-scrim/);
});

test("gates subtitles and choices only while AI voice narration is active", async () => {
  const player = await readFile(new URL("../components/story-player.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(player, /media\.kind === "audio" && media\.role === "voice"/);
  assert.match(player, /narrationState === "waiting" \|\| narrationState === "playing"/);
  assert.match(player, /addEventListener\("ended", handleEnded\)/);
  assert.match(player, /finishNarration\("failed"\)/);
  assert.match(player, /className="narration-skip"/);
  assert.match(player, /!pureView && !narrationActive/);
  assert.match(player, /voiceMedia \? "点击开始播放本段旁白"/);
  assert.match(player, /hasNarration\(initialNode\) \? "waiting" : "none"/);
  assert.match(styles, /\.narration-skip/);
});

test("provides a version-independent AI narration generation boundary", async () => {
  const controller = await readFile(new URL("../backend/src/stories/stories.controller.ts", import.meta.url), "utf8");
  const service = await readFile(new URL("../backend/src/stories/narration.service.ts", import.meta.url), "utf8");
  const provider = await readFile(new URL("../backend/src/stories/narration-provider.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../backend/src/database/schema.sql", import.meta.url), "utf8");
  assert.match(controller, /:id\/narration\/generate/);
  assert.match(controller, /:id\/nodes\/:nodeId\/narration\/generate/);
  assert.match(controller, /:id\/narration\/jobs\/:jobId/);
  assert.match(controller, /:id\/narration\/status/);
  assert.match(service, /narrationHash\(node\.content\)/);
  assert.match(service, /role: "voice"/);
  assert.match(provider, /interface NarrationProvider/);
  assert.match(provider, /TTS_BASE_URL/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS story_narration_jobs/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS story_narrations/);
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
  assert.equal((story.match(/media: sceneMedia\(/g) ?? []).length, 32);
  assert.match(story, /N01 雨夜失窃\.png/);
  assert.match(story, /N25 最后一盏灯\.png/);
  assert.match(story, /E05 码头边的救援\.png/);
  await access(new URL("../public/story-assets/mist-catch/N01%20%E9%9B%A8%E5%A4%9C%E5%A4%B1%E7%AA%83.png", import.meta.url));
  await access(new URL("../public/story-assets/optimized/mist-catch/N01%20%E9%9B%A8%E5%A4%9C%E5%A4%B1%E7%AA%83.webp", import.meta.url));
});

test("keeps the evening breeze and mist chase narratives contextually coherent", async () => {
  const eveningResponse = await render("/stories/evening-breeze-says");
  const mistResponse = await render("/stories/mist-catch-last-lamp");
  assert.equal(eveningResponse.status, 200);
  assert.equal(mistResponse.status, 200);
  assert.match(await eveningResponse.text(), /故事发生在书店关门前的最后一个雨夜/);
  assert.match(await mistResponse.text(), /你将以年轻民警林峥的视角/);

  const evening = await readFile(new URL("../lib/evening-breeze-web-story.ts", import.meta.url), "utf8");
  const mist = await readFile(new URL("../lib/mist-catch-story.ts", import.meta.url), "utf8");
  assert.doesNotMatch(evening, /两个人的书包|同一条走廊|旧街活动之后/);
  assert.match(evening, /七年的空白/);
  assert.match(evening, /信封里的七年前/);
  assert.match(mist, /id: "N17B"/);
  assert.match(mist, /三条线索指向同一地点/);
  assert.match(mist, /仓库危机以后/);
  assert.doesNotMatch(mist, /如果你允许周骁回家，他会/);
});

test("keeps the after-school story first-person, paced, and automatically routed", async () => {
  const response = await render("/stories/after-school-wind");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /我叫江予安，在雾溪县一中读高二/);
  assert.match(html, /我起身替她扶住桌角/);
  assert.doesNotMatch(html, /最终走向取决于|学习和感情数值/);

  const story = await readFile(new URL("../lib/after-school-wind-story.ts", import.meta.url), "utf8");
  const player = await readFile(new URL("../components/story-player.tsx", import.meta.url), "utf8");
  assert.match(story, /type: "condition"/);
  assert.equal((story.match(/type: "ending"/g) ?? []).length, 1);
  assert.equal((story.match(/\n  ending\(/g) ?? []).length, 11);
  assert.match(story, /speaker: "我"/);
  assert.match(story, /setFlag\("misunderstanding", false\)/);
  assert.match(player, /current\?\.type !== "condition"/);
  assert.match(player, /routedConditionRef/);
  assert.match(player, /"after-school-wind", "evening-breeze-says", "mist-catch-last-lamp"/);
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
