"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, ChevronLeft, ChevronRight, Clock3, Headphones, Play, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { StorySummary } from "@/shared/story-contract";

function nextRandomIndex(current: number, length: number) {
  if (length < 2) return current;
  let next = current;
  while (next === current) next = Math.floor(Math.random() * length);
  return next;
}

export function FeaturedStoryRotator({ stories, initialSlug }: { stories: StorySummary[]; initialSlug?: string }) {
  const initialIndex = Math.max(0, stories.findIndex((story) => story.slug === initialSlug));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const featured = stories[activeIndex] ?? stories[0];

  useEffect(() => {
    if (stories.length < 2) return;
    const firstTimer = window.setTimeout(() => setActiveIndex((current) => nextRandomIndex(current, stories.length)), 120);
    const timer = window.setInterval(() => setActiveIndex((current) => nextRandomIndex(current, stories.length)), 3000);
    return () => { window.clearTimeout(firstTimer); window.clearInterval(timer); };
  }, [stories.length]);

  if (!featured) return null;
  const tone = featured.tags.includes("恋爱") || featured.tags.includes("校园") ? "rose" : featured.tags.includes("科幻") ? "night" : featured.tags.includes("治愈") ? "sand" : "bamboo";

  return (
    <section className="feature-story" aria-label="随机推荐作品" aria-live="polite">
      <div className="feature-copy">
        <span className="section-label"><Sparkles size={15} />随机推荐 · 每 3 秒更新</span>
        <h2 key={featured.slug}>{featured.title}</h2><p key={`${featured.slug}-summary`}>{featured.summary}</p>
        <div className="feature-facts"><span><Clock3 size={15} />约 {featured.estimatedMinutes} 分钟</span><span><Bookmark size={15} />{featured.endingCount} 个结局</span><span><Headphones size={15} />建议佩戴耳机</span></div>
        <div className="feature-actions"><Link href={`/stories/${featured.slug}`} className="button primary"><Play size={17} fill="currentColor" />查看作品</Link><Link href={`/auth?returnTo=${encodeURIComponent(`/stories/${featured.slug}`)}`} className="button ghost"><Bookmark size={17} />加入仓库</Link></div>
        <div className="feature-rotator-controls"><button aria-label="上一部推荐" onClick={() => setActiveIndex((current) => (current - 1 + stories.length) % stories.length)}><ChevronLeft size={15} /></button><span>{String(activeIndex + 1).padStart(2, "0")} / {String(stories.length).padStart(2, "0")}</span><button aria-label="下一部推荐" onClick={() => setActiveIndex((current) => (current + 1) % stories.length)}><ChevronRight size={15} /></button><Link href={`/workshop?tag=${encodeURIComponent(featured.tags[0] ?? "")}`}>看更多同类 <ArrowRight size={13} /></Link></div>
      </div>
      <div className={`feature-art feature-art-${tone} ${featured.coverUrl ? "has-cover" : ""}`} aria-hidden="true">
        {featured.coverUrl ? <img src={featured.coverUrl} alt="" /> : null}
        <span className="feature-art-shade" /><span className="moon" /><span className="window-line line-one" /><span className="window-line line-two" /><span className="bamboo bamboo-one" /><span className="bamboo bamboo-two" /><span className="rain-mark r1" /><span className="rain-mark r2" /><span className="rain-mark r3" /><small>{featured.tags.slice(0, 3).join(" · ").toUpperCase()}</small>
      </div>
    </section>
  );
}
