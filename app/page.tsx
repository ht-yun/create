import Link from "next/link";
import { ArrowRight, ChevronRight, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FeaturedStoryRotator } from "@/components/featured-story-rotator";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/api";

export default async function Home() {
  const stories = await getStories();
  const featured = stories.find((story) => story.slug === "rain-night-visitor") ?? stories[0];
  const warehouse = stories.slice(1, 4);

  return (
    <AppShell active="home">
      <div className="page-wrap home-page">
        <header className="page-header">
          <div><span className="eyebrow">今日宜 · 入戏</span><h1>晚上好，去往哪段故事？</h1></div>
          <form action="/workshop" className="search-box"><Search size={18} /><input name="search" aria-label="搜索剧情" placeholder="搜索剧情、作者或标签" /><button>搜索</button></form>
        </header>
        {featured ? <FeaturedStoryRotator stories={stories} initialSlug={featured.slug} /> : null}
        <section className="content-section" id="warehouse">
          <div className="section-heading"><div><span className="eyebrow">MY COLLECTION</span><h2>我的仓库</h2><p>收藏的故事与尚未走完的旅程。</p></div><Link href="/auth">登录后同步 <ChevronRight size={16} /></Link></div>
          <div className="story-grid home-grid">{warehouse.map((story) => <StoryCard key={story.id} story={story} compact />)}</div>
        </section>
        <section className="home-discover">
          <div className="daily-note"><span>每日一签</span><blockquote>“真正改变结局的，常常是那句差一点没有说出口的话。”</blockquote><small>——《晚风替我说》</small></div>
          <div className="creator-invite"><div><span className="section-label">创作者计划</span><h3>你心里的故事，也值得被走一遍</h3><p>从引导模式开始，不需要编程，十分钟搭好第一段分支。</p></div><Link href="/studio" className="button pale">开始创作 <ArrowRight size={17} /></Link></div>
        </section>
      </div>
    </AppShell>
  );
}
