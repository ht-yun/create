import Link from "next/link";
import { ArrowRight, Blocks, ChevronDown, Compass, PenLine, Search, SlidersHorizontal, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/api";

export const metadata = { title: "创意工坊" };

export default async function Workshop({ searchParams }: { searchParams: Promise<{ search?: string; tag?: string }> }) {
  const params = await searchParams;
  const query = params.search?.trim() ?? "";
  const activeTag = params.tag?.trim() ?? "";
  const allStories = await getStories();
  const stories = allStories.filter((story) => {
    const matchesQuery = !query || [story.title, story.authorName, story.summary, ...story.tags].join(" ").includes(query);
    const matchesTag = !activeTag || story.tags.includes(activeTag);
    return matchesQuery && matchesTag;
  });
  return (
    <AppShell active="workshop"><div className="page-wrap">
      <header className="workshop-header"><div><span className="eyebrow">CREATIVE WORKSHOP</span><h1>创意工坊</h1><p>发现别人写下的世界，也让自己的故事开始生长。</p></div><Link href="/studio" className="button primary"><PenLine size={17} />制作剧情</Link></header>
      <div className="workshop-tabs"><button className="active"><Compass size={17} />发现剧情</button><Link href="/studio"><Blocks size={17} />我的创作</Link></div>
      <section className="discover-toolbar"><form action="/workshop" className="search-box wide"><Search size={18} /><input name="search" defaultValue={query} aria-label="搜索工坊剧情" placeholder="搜索标题、作者或标签" />{activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}<button>搜索</button></form><Link className="filter-button" href={activeTag ? "/workshop" : "/workshop?tag=恋爱"}><SlidersHorizontal size={17} />{activeTag || "筛选"}<ChevronDown size={15} /></Link></section>
      <div className="filter-chips"><Link className={!activeTag ? "active" : ""} href={query ? `/workshop?search=${encodeURIComponent(query)}` : "/workshop"}>全部</Link>{["恋爱", "悬疑", "奇幻", "校园", "治愈", "科幻", "古风"].map((tag) => <Link className={activeTag === tag ? "active" : ""} href={`/workshop?tag=${encodeURIComponent(tag)}${query ? `&search=${encodeURIComponent(query)}` : ""}`} key={tag}>{tag}</Link>)}</div>
      <section className="content-section flush"><div className="section-heading"><div><h2>{query ? `“${query}”的结果` : activeTag ? `${activeTag}作品` : "正在生长的故事"}</h2><p>综合完成率、收藏与近期口碑推荐。</p></div><span className="result-count">{stories.length} 部作品</span></div>
        <div className="story-grid workshop-grid">{stories.map((story) => <StoryCard key={story.id} story={story} />)}</div>
        {!stories.length ? <div className="empty-state"><WandSparkles size={30} /><h3>还没有找到对应剧情</h3><p>换一个关键词，或者成为第一个写下它的人。</p><Link href="/studio">创建新故事 <ArrowRight size={16} /></Link></div> : null}
      </section>
    </div></AppShell>
  );
}
