"use client";

import { useRef, useState } from "react";
import { Download, FileInput, LoaderCircle } from "lucide-react";
import { importStoryFile, storyExportUrl, validateStoryFile } from "@/lib/story-package";

export function StoryPackageActions({ storyId, showImport = true }: { storyId?: string; showImport?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onImport(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("正在校验剧情文件…");
    try {
      const report = await validateStoryFile(file);
      if (!report.valid) {
        setMessage(report.errors.slice(0, 2).map((error) => `${error.path}：${error.message}`).join("；"));
        return;
      }
      const summary = report.story ? `${report.story.title} · ${report.story.nodeCount} 个节点 · ${report.story.endingCount} 个结局` : "剧情文件";
      if (!window.confirm(`确认导入“${summary}”吗？平台会创建一个新的私有草稿。`)) {
        setMessage("已取消导入");
        return;
      }
      const imported = await importStoryFile(file);
      setMessage("导入成功，正在打开新草稿…");
      window.location.href = imported.id ? `/studio/editor?storyId=${encodeURIComponent(imported.id)}` : "/studio";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "剧情导入失败");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return <div className="story-package-actions">
    {showImport ? <>
      <input ref={inputRef} type="file" accept=".story.json,.storypack.zip,application/json,application/zip" hidden onChange={(event) => void onImport(event.target.files?.[0])} />
      <button className="button ghost" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <FileInput size={16} />}导入剧情</button>
    </> : null}
    {storyId ? <>
      <a className="button ghost" href={storyExportUrl(storyId, "json")}><Download size={16} />导出 JSON</a>
      <a className="button ghost" href={storyExportUrl(storyId, "storypack")}><Download size={16} />导出完整作品包</a>
    </> : null}
    {message ? <span className="story-package-status" role="status">{message}</span> : null}
  </div>;
}
