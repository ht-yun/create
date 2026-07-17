import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const base = "http://127.0.0.1:4000/api";
const child = spawn(process.execPath, ["--import", "tsx", "src/main.ts"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: "4000" },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

child.stdout.on("data", (chunk) => process.stdout.write(`[api] ${chunk}`));
child.stderr.on("data", (chunk) => process.stderr.write(`[api] ${chunk}`));

async function waitForApi() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return response.json();
    } catch { /* service is still starting */ }
    await delay(500);
  }
  throw new Error("API did not become ready within 15 seconds");
}

async function json(path: string, init?: RequestInit) {
  const response = await fetch(`${base}${path}`, init);
  const payload = await response.json();
  if (!response.ok) throw new Error(`${init?.method ?? "GET"} ${path}: ${response.status} ${JSON.stringify(payload)}`);
  return { response, payload };
}

async function run() {
try {
  const health = await waitForApi();
  const publicStories = await json("/stories");
  const email = `smoke-${Date.now()}@example.com`;
  const password = "Storyloom!2026";
  const registration = await json("/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, displayName: "烟雨测试者", password }) });
  const code = registration.payload.devVerificationCode as string;
  await json("/auth/verify-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code }) });
  const login = await json("/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  const cookie = login.response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Login did not set a session cookie");
  const authHeaders = { "content-type": "application/json", cookie };
  const me = await json("/auth/me", { headers: authHeaders });
  const graph = { version: 1, startNodeId: "start", variables: [{ key: "trust", label: "信任", type: "number", initialValue: 0, min: 0, max: 10 }], nodes: [{ id: "start", type: "scene", title: "测试起点", content: "这是端到端测试剧情。", choices: [{ id: "to-end", label: "抵达结局", targetNodeId: "end", changes: [{ key: "trust", operation: "add", value: 1 }] }] }, { id: "end", type: "ending", title: "测试结局", content: "测试完成。", endingKey: "done" }] };
  const created = await json("/stories", { method: "POST", headers: authHeaders, body: JSON.stringify({ title: "端到端测试剧情", summary: "验证作品创建、发布与公开读取。", tags: ["测试"], visibility: "public", graph }) });
  await json(`/stories/${created.payload.id}`, { method: "PATCH", headers: authHeaders, body: JSON.stringify({ status: "published", visibility: "public" }) });
  const detail = await json(`/stories/${created.payload.slug}`);
  const mine = await json("/stories/mine", { headers: authHeaders });
  console.log(JSON.stringify({
    health,
    seededPublicStories: publicStories.payload.length,
    authenticatedAs: me.payload.user.email,
    createdStory: detail.payload.slug,
    myStoryCount: mine.payload.length,
    result: "PASS",
  }, null, 2));
} finally {
  child.kill("SIGTERM");
  await delay(300);
}
}

void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
