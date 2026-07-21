"use client";

import { useState } from "react";
import { Check, Crosshair, Monitor, Music2, Smartphone, Sparkles, Volume2, X } from "lucide-react";

type PreviewMode = "desktop" | "mobile" | "complete";

export function ImmersivePresentationPanel({ nodeTitle, onStatus }: { nodeTitle: string; onStatus: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewMode>("desktop");
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 42 });
  const [role, setRole] = useState("scene");
  const [transition, setTransition] = useState("fade");
  const [textReveal, setTextReveal] = useState("paragraph");
  const [volume, setVolume] = useState(55);
  const [loop, setLoop] = useState(true);

  function markChanged(message: string) { onStatus(`沉浸设置已更新 · ${message}`); }

  return <div className={`presentation-tool ${open ? "open" : ""}`}>
    <button className="presentation-trigger" onClick={() => setOpen((value) => !value)}><Sparkles size={16} />沉浸呈现</button>
    {open ? <aside className="presentation-panel">
      <div className="presentation-heading"><div><span>节点呈现</span><strong>{nodeTitle}</strong></div><button onClick={() => setOpen(false)} aria-label="关闭沉浸设置"><X size={17} /></button></div>
      <div className="preview-tabs"><button className={preview === "desktop" ? "active" : ""} onClick={() => setPreview("desktop")}><Monitor size={15} />横屏</button><button className={preview === "mobile" ? "active" : ""} onClick={() => setPreview("mobile")}><Smartphone size={15} />竖屏</button><button className={preview === "complete" ? "active" : ""} onClick={() => setPreview("complete")}><Crosshair size={15} />完整</button></div>
      <button className={`focal-preview ${preview}`} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const next = { x: Math.round((event.clientX - rect.left) / rect.width * 100), y: Math.round((event.clientY - rect.top) / rect.height * 100) }; setFocalPoint(next); markChanged(`焦点 ${next.x}%, ${next.y}%`); }} aria-label="点击设置画面主体焦点"><span style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}><Crosshair size={17} /></span><small>点击画面设置主体焦点</small></button>
      <div className="presentation-grid"><label>媒体角色<select value={role} onChange={(event) => { setRole(event.target.value); markChanged("媒体角色"); }}><option value="scene">场景画面</option><option value="music">背景音乐</option><option value="ambience">环境音</option><option value="voice">对白/旁白</option><option value="effect">一次性音效</option></select></label><label>画面转场<select value={transition} onChange={(event) => { setTransition(event.target.value); markChanged("画面转场"); }}><option value="fade">淡入</option><option value="dissolve">柔和溶解</option><option value="cut">直接切换</option></select></label><label>文字节奏<select value={textReveal} onChange={(event) => { setTextReveal(event.target.value); markChanged("文字节奏"); }}><option value="paragraph">分段淡入</option><option value="instant">立即显示</option></select></label></div>
      <label className="presentation-volume"><span><Volume2 size={15} />默认音量 <b>{volume}%</b></span><input type="range" min="0" max="100" value={volume} onChange={(event) => { setVolume(Number(event.target.value)); markChanged("默认音量"); }} /></label>
      <label className="presentation-check"><span><Music2 size={15} />跨节点循环播放</span><input type="checkbox" checked={loop} onChange={(event) => { setLoop(event.target.checked); markChanged("循环设置"); }} /></label>
      <div className="presentation-audit"><strong><Check size={15} />发布前体验检查</strong><span>替代文本、字幕、焦点裁切、媒体音量、降低动态效果</span></div>
    </aside> : null}
  </div>;
}
