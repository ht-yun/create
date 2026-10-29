import Link from "next/link";
import { Blocks, Compass, PenLine, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WorkshopSeriesOrganizer } from "@/components/workshop-series-organizer";
import { WorkshopFilterMenu, type WorkshopDuration, type WorkshopSort } from "@/components/workshop-filter-menu";
import { getStories } from "@/lib/api";

export const metadata = { title: "创意工坊" };

const TAGS = ["恋爱", "悬疑", "奇幻", "校园", "治愈", "科幻", "古风"];
const SORTS: WorkshopSort[] = ["recommended", "latest", "popular", "rating"];
const DURATIONS: WorkshopDuration[] = ["all", "short", "medium", "long"];

function readOption<T extends string>(value: string | undefined, options: T[], fallback: T) {
  return value && options.includes(value as T) ? value as T : fallback;
}

export default async function Workshop({ searchParams }: { searchParams: Promise<{ search?: string; tag?: string; sort?: string; duration?: string }> }) {
  const params = await searchParams;
  const query = params.search?.trim() ?? "";
  const activeTag = params.tag?.trim() ?? "";
  const sort = readOption(params.sort, SORTS, "recommended");
  const duration = readOption(params.duration, DURATIONS, "all");
  const allStories = await getStories();
  const filteredStories = allStories.filter((story) => {
    const matchesQuery = !query || [story.title, story.authorName, story.summary, ...story.tags].join(" ").includes(query);
    const matchesTag = !activeTag || story.tags.includes(activeTag);
    const matchesDuration = duration === "all"
      || duration === "short" && story.estimatedMinutes <= 10
      || duration === "medium" && story.estimatedMinutes >= 11 && story.estimatedMinutes <= 20
      || duration === "long" && story.estimatedMinutes >= 21;
    return matchesQuery && matchesTag && matchesDuration;
  });
  const stories = [...filteredStories].sort((left, right) => {
    if (sort === "latest") return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    if (sort === "popular") return right.playCount - left.playCount;
    if (sort === "rating") return right.score - left.score;
    return 0;
  });
  const workshopHref = (changes: { tag?: string; search?: string; sort?: WorkshopSort; duration?: WorkshopDuration }) => {
    const values = { search: query, tag: activeTag, sort, duration, ...changes };
    const next = new URLSearchParams();
    if (values.search) next.set("search", values.search);
    if (values.tag) next.set("tag", values.tag);
    if (values.sort && values.sort !== "recommended") next.set("sort", values.sort);
    if (values.duration && values.duration !== "all") next.set("duration", values.duration);
    const queryString = next.toString();
    return queryString ? `/workshop?${queryString}` : "/workshop";
  };
  return (
    <AppShell active="workshop"><div className="page-wrap workshop-page">
      <header className="workshop-header"><div><span className="eyebrow">CREATIVE WORKSHOP</span><h1>创意工坊</h1><p>发现别人写下的世界，也让自己的故事开始生长。</p></div><Link href="/studio" className="button primary"><PenLine size={17} />制作剧情</Link></header>
      <div className="workshop-navigation-row">
        <div className="workshop-tabs"><button className="active"><Compass size={17} />发现剧情</button><Link href="/studio"><Blocks size={17} />我的创作</Link></div>
        <WorkshopSeriesOrganizer stories={stories} query={query} activeTag={activeTag} />
      </div>
      <section className="discover-toolbar"><form action="/workshop" className="search-box wide"><Search size={18} /><input name="search" defaultValue={query} aria-label="搜索工坊剧情" placeholder="搜索标题、作者或标签" />{activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}{sort !== "recommended" ? <input type="hidden" name="sort" value={sort} /> : null}{duration !== "all" ? <input type="hidden" name="duration" value={duration} /> : null}<button>搜索</button></form><WorkshopFilterMenu query={query} currentTag={activeTag} currentSort={sort} currentDuration={duration} tags={TAGS} /></section>
      <div className="filter-chips"><Link className={!activeTag ? "active" : ""} href={workshopHref({ tag: "" })}>全部</Link>{TAGS.map((tag) => <Link className={activeTag === tag ? "active" : ""} href={workshopHref({ tag })} key={tag}>{tag}</Link>)}</div>
    </div></AppShell>
  );
}
