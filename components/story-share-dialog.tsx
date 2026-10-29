"use client";

import { Check, Copy, ExternalLink, QrCode, Share2, X } from "lucide-react";
import { useState } from "react";
import type { StoryDetail } from "@/shared/story-contract";

type StoryShareDialogProps = {
  story: Pick<StoryDetail, "slug" | "title" | "summary">;
  className?: string;
  label?: string;
};

export function StoryShareDialog({ story, className = "button ghost", label = "分享二维码" }: StoryShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const playUrl = typeof window === "undefined" ? "" : `${window.location.origin}/stories/${story.slug}/play`;
  const qrUrl = playUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=14&data=${encodeURIComponent(playUrl)}` : "";

  async function copyLink() {
    if (!playUrl) return;
    try {
      await navigator.clipboard.writeText(playUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* Clipboard access can be unavailable in an embedded browser. */ }
  }

  async function shareLink() {
    if (!playUrl) return;
    if (navigator.share) {
      await navigator.share({ title: story.title, text: story.summary, url: playUrl }).catch(() => undefined);
      return;
    }
    await copyLink();
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}><QrCode size={17} />{label}</button>
      {open ? <div className="story-share-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <section className="story-share-dialog" role="dialog" aria-modal="true" aria-labelledby="story-share-title">
          <div className="story-share-heading"><div><span className="eyebrow">SHARE THIS STORY</span><h2 id="story-share-title">扫码进入剧情</h2></div><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="关闭二维码分享"><X size={18} /></button></div>
          <p className="story-share-description">使用手机相机或微信扫一扫，直接打开《{story.title}》并开始体验。</p>
          <div className="story-share-qr">{qrUrl ? <img src={qrUrl} alt={`《${story.title}》剧情二维码`} /> : <span>正在生成二维码…</span>}</div>
          <div className="story-share-link"><ExternalLink size={14} /><span>{playUrl || "当前地址将在浏览器中生成"}</span></div>
          <div className="story-share-actions"><button type="button" className="button ghost" onClick={copyLink}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "已复制链接" : "复制链接"}</button><button type="button" className="button primary" onClick={shareLink}><Share2 size={16} />分享给朋友</button></div>
          <small className="story-share-note">二维码只包含剧情地址，不会携带账号或游玩记录。</small>
        </section>
      </div> : null}
    </>
  );
}
