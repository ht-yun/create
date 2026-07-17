import Link from "next/link";
import { ArrowUpRight, Crown, Flame, Heart, Play, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getStories, compactCount } from "@/lib/api";

export const metadata = { title: "排行榜" };

export default async function Rankings({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const sort = (await searchParams).sort ?? "overall";
  const stories = (await getStories()).sort((a, b) => sort === "favorites"
    ? b.favoriteCount - a.favoriteCount
    : sort === "new"
      ? b.id.localeCompare(a.id)
      : sort === "completed"
        ? b.endingCount - a.endingCount
        : b.score * 1000 + b.playCount - (a.score * 1000 + a.playCount));
  return (
    <AppShell active="rankings"><div className="page-wrap rankings-page">
      <header className="workshop-header"><div><span className="eyebrow">STORY RANKINGS</span><h1>排行榜</h1><p>由真实体验、完成率与收藏共同写下的本周榜单。</p></div><span className="updated-badge"><Flame size={16} />每小时更新</span></header>
      <div className="ranking-tabs"><Link className={sort === "overall" ? "active" : ""} href="/rankings">综合榜</Link><Link className={sort === "new" ? "active" : ""} href="/rankings?sort=new">新作榜</Link><Link className={sort === "favorites" ? "active" : ""} href="/rankings?sort=favorites">收藏榜</Link><Link className={sort === "completed" ? "active" : ""} href="/rankings?sort=completed">完结榜</Link></div>
      <section className="podium">{stories.slice(0, 3).map((story, index) => <article key={story.id} className={`podium-card place-${index + 1}`}><span className="podium-number">{index === 0 ? <Crown size={22} /> : index + 1}</span><div className="podium-art"><span>{story.tags[0]}</span><strong>{story.title.slice(0, 1)}</strong></div><div><span>{story.tags.join(" · ")}</span><h2>{story.title}</h2><p>{story.authorName}</p><strong><Star size={15} fill="currentColor" />{story.score.toFixed(1)}</strong></div><Link href={`/stories/${story.slug}`} aria-label={`体验${story.title}`}><ArrowUpRight size={18} /></Link></article>)}</section>
      <section className="ranking-list"><div className="ranking-row ranking-head"><span>排名</span><span>作品</span><span>热度</span><span>收藏</span><span>评分</span><span /></div>{stories.slice(3).map((story, index) => <div className="ranking-row" key={story.id}><strong>{String(index + 4).padStart(2, "0")}</strong><div><span className="mini-cover">{story.title.slice(0, 1)}</span><div><Link href={`/stories/${story.slug}`}>{story.title}</Link><small>{story.authorName} · {story.tags.join(" / ")}</small></div></div><span><Play size={14} />{compactCount(story.playCount)}</span><span><Heart size={14} />{compactCount(story.favoriteCount)}</span><b>{story.score.toFixed(1)}</b><Link href={`/stories/${story.slug}`}>体验</Link></div>)}</section>
    </div></AppShell>
  );
}
