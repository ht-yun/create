import Link from "next/link";
import { ArrowUpRight, Clock3, Heart, Route } from "lucide-react";
import type { StorySummary } from "@/shared/story-contract";
import { compactCount } from "@/lib/api";

export function StoryCard({ story, rank, compact = false }: { story: StorySummary; rank?: number; compact?: boolean }) {
  const tone = story.tags.includes("恋爱") || story.tags.includes("校园") ? "rose" : story.tags.includes("科幻") ? "night" : story.tags.includes("治愈") ? "sand" : "bamboo";
  const isPopular = story.favoriteCount >= 8000 || story.score >= 9.5;
  return (
    <article className={`story-card ${compact ? "compact" : ""}`}>
      <Link href={`/stories/${story.slug}`} className={`story-cover cover-${tone} ${story.coverUrl ? "has-image" : ""}`} aria-label={`查看《${story.title}》`}>
        {story.coverUrl ? <img src={story.coverUrl} alt="" aria-hidden="true" /> : null}
        {rank ? <span className="rank-number">{String(rank).padStart(2, "0")}</span> : null}
        <span className="story-cover-topline"><span className="cover-kicker">{story.tags[0]}</span>{isPopular ? <span className="story-card-badge">热门</span> : null}</span>
        <span className="cover-title">{story.title}</span>
        <span className="story-cover-facts"><span>{story.estimatedMinutes} 分钟</span><span>{story.endingCount} 结局</span></span>
        <span className="cover-branch"><i /><i /><i /></span>
      </Link>
      <div className="story-card-body">
        <div className="story-card-heading">
          <div><Link href={`/stories/${story.slug}`}>{story.title}</Link><span>作者 · {story.authorName}</span></div>
          <strong>{story.score.toFixed(1)}</strong>
        </div>
        {!compact ? <p>{story.summary}</p> : null}
        <div className="story-tags">{story.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="story-card-footer"><div className="story-meta">
          <span><Clock3 size={14} />{story.estimatedMinutes} 分钟</span>
          <span><Route size={14} />{story.endingCount} 结局</span>
          <span><Heart size={14} />{compactCount(story.favoriteCount)}</span>
        </div><span className="story-card-link">查看作品 <ArrowUpRight size={14} /></span></div>
      </div>
    </article>
  );
}
