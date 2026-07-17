import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
