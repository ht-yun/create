import Link from "next/link";
import { ArrowLeft, Bookmark, Clock3, Heart, MessageCircle, Play, Route, Star } from "lucide-react";
import type { StoryDetail as StoryDetailData } from "@/shared/story-contract";
import { AppShell } from "@/components/app-shell";
import { StoryComments } from "@/components/story-comments";
import { StoryShareDialog } from "@/components/story-share-dialog";
import { compactCount } from "@/lib/api";

function coverTone(story: StoryDetailData) {
  if (story.tags.includes("恋爱") || story.tags.includes("校园")) return "rose";
  if (story.tags.includes("科幻")) return "night";
  if (story.tags.includes("治愈")) return "sand";
  return "bamboo";
}

export function StoryDetail({ story }: { story: StoryDetailData }) {
  const tone = coverTone(story);
  return (
    <AppShell active="workshop">
      <div className="page-wrap story-detail-page">
        <Link href="/workshop" className="story-detail-back"><ArrowLeft size={16} />返回创意工坊</Link>
        <section className="story-detail-hero">
          <div className={`story-detail-cover cover-${tone}`}>
            {story.coverUrl ? <img src={story.coverUrl} alt={`${story.title}作品封面`} /> : <div className="story-detail-cover-fallback"><span>{story.tags[0]}</span><strong>{story.title.slice(0, 1)}</strong></div>}
            <span className="story-detail-cover-shade" />
            <span className="story-detail-cover-label">INTERACTIVE STORY</span>
            <strong className="story-detail-cover-title">{story.title}</strong>
          </div>
          <div className="story-detail-intro">
            <div className="story-detail-tags">{story.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
            <h1>{story.title}</h1>
            <p className="story-detail-author">作者 · {story.authorName}</p>
            <div className="story-detail-rating"><Star size={17} fill="currentColor" /><strong>{story.score ? story.score.toFixed(1) : "新作"}</strong><span>综合评分</span></div>
            <p className="story-detail-summary">{story.summary}</p>
            <div className="story-detail-actions"><Link href={`/stories/${story.slug}/play`} className="button primary"><Play size={17} fill="currentColor" />开始体验</Link><div className="story-detail-secondary-actions"><Link href={`/auth?returnTo=${encodeURIComponent(`/stories/${story.slug}`)}`} className="button ghost"><Bookmark size={17} />收藏作品</Link><Link href={`/community?share=${encodeURIComponent(story.slug)}`} className="button ghost"><MessageCircle size={17} />分享到社区</Link><StoryShareDialog story={story} /></div></div>
            <div className="story-detail-facts"><span><Clock3 size={15} />约 {story.estimatedMinutes} 分钟</span><span><Route size={15} />{story.endingCount} 个结局</span><span><Heart size={15} />{compactCount(story.favoriteCount)} 人收藏</span></div>
          </div>
        </section>
        <div className="story-detail-columns">
          <main className="story-detail-main">
            <section className="story-detail-about"><div className="story-detail-section-heading"><div><span className="eyebrow">ABOUT THIS STORY</span><h2>作品简介</h2></div></div><p>{story.summary}</p><p>这是一段可以亲自走过的互动叙事。每一次选择都会留下痕迹，回到已经走过的节点时，你也能重新看看当时的判断如何改变了故事。</p></section>
            <StoryComments story={story} />
          </main>
          <aside className="story-detail-aside"><div className="story-detail-aside-card"><span className="eyebrow">READY?</span><h2>现在就走进<br />{story.title}</h2><p>先了解故事，再决定从哪一个选择开始。</p><Link href={`/stories/${story.slug}/play`} className="button primary">进入剧情 <Play size={15} fill="currentColor" /></Link></div><div className="story-detail-aside-card quiet"><Heart size={19} /><strong>喜欢这段故事吗？</strong><span>收藏后可以在我的仓库里继续回来。</span></div></aside>
        </div>
      </div>
    </AppShell>
  );
}
