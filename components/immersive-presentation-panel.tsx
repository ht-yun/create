"use client";

import { useEffect, useState } from "react";
import { Check, Crosshair, LoaderCircle, Monitor, Music2, Smartphone, Sparkles, Volume2, WandSparkles, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import type { StoryNarrationStatus } from "@/shared/story-contract";

type PreviewMode = "desktop" | "mobile" | "complete";

export function ImmersivePresentationPanel({ nodeTitle, storyId, onStatus }: { nodeTitle: string; storyId?: string; onStatus: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewMode>("desktop");
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 42 });
  const [role, setRole] = useState("scene");
  const [transition, setTransition] = useState("fade");
  const [textReveal, setTextReveal] = useState("paragraph");
  const [volume, setVolume] = useState(55);
  const [loop, setLoop] = useState(true);
  const [voiceId, setVoiceId] = useState("alloy");
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [narrationStatus, setNarrationStatus] = useState<StoryNarrationStatus>();
  const [narrationBusy, setNarrationBusy] = useState(false);

  function markChanged(message: string) { onStatus(`沉浸设置已更新 · ${message}`); }

  useEffect(() => {
    if (!open || !storyId) return;
    let cancelled = false;
    void fetch(`${API_URL}/stories/${encodeURIComponent(storyId)}/narration/status`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("无法读取旁白状态");
        return response.json() as Promise<StoryNarrationStatus>;
      })
      .then((value) => {
        if (cancelled) return;
        setNarrationStatus(value);
        setVoiceId(value.settings.voiceId);
        setVoiceSpeed(Number(value.settings.speed));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [open, storyId]);

  async function generateNarration() {
    if (!storyId || narrationBusy) return;
    setNarrationBusy(true);
    onStatus("AI 旁白任务正在创建");
    try {
      const response = await fetch(`${API_URL}/stories/${encodeURIComponent(storyId)}/narration/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voiceId, speed: voiceSpeed, volume: volume / 100 }),
      });
      const created = await response.json() as { jobId?: string; message?: string };
      if (!response.ok || !created.jobId) throw new Error(created.message ?? "AI 旁白任务创建失败");
      onStatus("AI 旁白正在后台生成");
      for (;;) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const jobResponse = await fetch(`${API_URL}/stories/${encodeURIComponent(storyId)}/narration/jobs/${encodeURIComponent(created.jobId)}`, { credentials: "include" });
        if (!jobResponse.ok) throw new Error("无法查询旁白生成进度");
        const job = await jobResponse.json() as { status: string; completedNodes: number; totalNodes: number; failedNodes: number };
        onStatus(`AI 旁白 ${job.completedNodes}/${job.totalNodes}`);
        if (job.status === "completed") {
          onStatus(`AI 旁白已生成 · ${job.completedNodes} 个节点`);
          break;
        }
        if (job.status === "failed") throw new Error(`${job.failedNodes} 个节点生成失败，可稍后重试`);
      }
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "AI 旁白生成失败");
    } finally {
      setNarrationBusy(false);
    }
  }

  return <div className={`presentation-tool ${open ? "open" : ""}`}>
    <button className="presentation-trigger" onClick={() => setOpen((value) => !value)}><Sparkles size={16} />沉浸呈现</button>
    {open ? <aside className="presentation-panel">
      <div className="presentation-heading"><div><span>节点呈现</span><strong>{nodeTitle}</strong></div><button onClick={() => setOpen(false)} aria-label="关闭沉浸设置"><X size={17} /></button></div>
      <div className="preview-tabs"><button className={preview === "desktop" ? "active" : ""} onClick={() => setPreview("desktop")}><Monitor size={15} />横屏</button><button className={preview === "mobile" ? "active" : ""} onClick={() => setPreview("mobile")}><Smartphone size={15} />竖屏</button><button className={preview === "complete" ? "active" : ""} onClick={() => setPreview("complete")}><Crosshair size={15} />完整</button></div>
      <button className={`focal-preview ${preview}`} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const next = { x: Math.round((event.clientX - rect.left) / rect.width * 100), y: Math.round((event.clientY - rect.top) / rect.height * 100) }; setFocalPoint(next); markChanged(`焦点 ${next.x}%, ${next.y}%`); }} aria-label="点击设置画面主体焦点"><span style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}><Crosshair size={17} /></span><small>点击画面设置主体焦点</small></button>
      <div className="presentation-grid"><label>媒体角色<select value={role} onChange={(event) => { setRole(event.target.value); markChanged("媒体角色"); }}><option value="scene">场景画面</option><option value="music">背景音乐</option><option value="ambience">环境音</option><option value="voice">对白/旁白</option><option value="effect">一次性音效</option></select></label><label>画面转场<select value={transition} onChange={(event) => { setTransition(event.target.value); markChanged("画面转场"); }}><option value="fade">淡入</option><option value="dissolve">柔和溶解</option><option value="cut">直接切换</option></select></label><label>文字节奏<select value={textReveal} onChange={(event) => { setTextReveal(event.target.value); markChanged("文字节奏"); }}><option value="paragraph">分段淡入</option><option value="instant">立即显示</option></select></label></div>
      <label className="presentation-volume"><span><Volume2 size={15} />默认音量 <b>{volume}%</b></span><input type="range" min="0" max="100" value={volume} onChange={(event) => { setVolume(Number(event.target.value)); markChanged("默认音量"); }} /></label>
      <label className="presentation-check"><span><Music2 size={15} />跨节点循环播放</span><input type="checkbox" checked={loop} onChange={(event) => { setLoop(event.target.checked); markChanged("循环设置"); }} /></label>
      <section className="narration-authoring">
        <div><strong><WandSparkles size={15} />AI 旁白</strong><small>整部作品统一音色，保存正文后手动生成</small></div>
        <label>旁白音色<input value={voiceId} maxLength={80} onChange={(event) => setVoiceId(event.target.value)} placeholder="alloy" /></label>
        <label>语速 <b>{voiceSpeed.toFixed(1)}×</b><input type="range" min=".5" max="2" step=".1" value={voiceSpeed} onChange={(event) => setVoiceSpeed(Number(event.target.value))} /></label>
        {narrationStatus ? <p>{narrationStatus.nodes.filter((node) => node.status === "ready" || node.status === "manual").length}/{narrationStatus.nodes.length} 个节点已有旁白{narrationStatus.nodes.some((node) => node.status === "stale") ? " · 有正文修改后尚未重新生成" : ""}</p> : null}
        <button disabled={!storyId || narrationBusy} onClick={generateNarration}>{narrationBusy ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />}{storyId ? narrationBusy ? "正在生成…" : "生成全部旁白" : "保存为平台草稿后可生成"}</button>
      </section>
      <div className="presentation-audit"><strong><Check size={15} />发布前体验检查</strong><span>替代文本、字幕、焦点裁切、媒体音量、降低动态效果</span></div>
    </aside> : null}
  </div>;
}
