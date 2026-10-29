"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bookmark, ChevronRight, Flame, Heart, MessageCircle, PenLine, Plus, Search, Send, Sparkles, Users, X } from "lucide-react";
import type { CommunityPost, CommunityPostKind, CommunityStoryRef } from "@/lib/community-data";
import type { StorySummary } from "@/shared/story-contract";

type Filter = "all" | CommunityPostKind;
type SortMode = "latest" | "popular";

interface CommunityHubProps {
  initialPosts: CommunityPost[];
  shareStories: StorySummary[];
  initialShareStory?: CommunityStoryRef;
  initialTopic?: string;
}

const kindLabels: Record<CommunityPostKind, string> = { share: "作品分享", discussion: "讨论" };

export function CommunityHub({ initialPosts, shareStories, initialShareStory, initialTopic }: CommunityHubProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortMode>("latest");
  const [query, setQuery] = useState(initialTopic ?? "");
  const [liked, setLiked] = useState<string[]>([]);
  const [composerOpen, setComposerOpen] = useState(Boolean(initialShareStory));
  const [kind, setKind] = useState<CommunityPostKind>(initialShareStory ? "share" : "discussion");
  const [title, setTitle] = useState(initialShareStory ? `推荐《${initialShareStory.title}》` : "");
  const [body, setBody] = useState("");
  const [selectedStorySlug, setSelectedStorySlug] = useState(initialShareStory?.slug ?? shareStories[0]?.slug ?? "");
  const [notice, setNotice] = useState("");

  const selectedStory = useMemo(() => {
    if (initialShareStory && selectedStorySlug === initialShareStory.slug) return initialShareStory;
    const story = shareStories.find((item) => item.slug === selectedStorySlug);
    return story ? { slug: story.slug, title: story.title, authorName: story.authorName, summary: story.summary, coverUrl: story.coverUrl, tags: story.tags } : undefined;
  }, [initialShareStory, selectedStorySlug, shareStories]);

  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = posts
      .filter((post) => filter === "all" || post.kind === filter)
      .filter((post) => !normalized || `${post.title} ${post.body} ${post.tags.join(" ")} ${post.author}`.toLowerCase().includes(normalized));
    return sort === "popular" ? [...filtered].sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments)) : filtered;
  }, [filter, posts, query, sort]);

  function toggleLike(postId: string) {
    setLiked((current) => current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]);
  }

  function openComposer(nextKind: CommunityPostKind, story?: CommunityStoryRef) {
    setKind(nextKind);
    setComposerOpen(true);
    if (story) {
      setSelectedStorySlug(story.slug);
      setTitle(`推荐《${story.title}》`);
    }
  }

  function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setNotice("请先写下标题和内容");
      return;
    }
    const post: CommunityPost = {
      id: `community-local-${Date.now()}`,
      kind,
      author: "我",
      role: "刚刚发布",
      avatar: "我",
      createdAt: "刚刚",
      title: title.trim(),
      body: body.trim(),
      tags: kind === "share" && selectedStory ? [selectedStory.title, "作品分享"] : ["社区讨论"],
      likes: 0,
      comments: 0,
      story: kind === "share" ? selectedStory : undefined,
    };
    setPosts((current) => [post, ...current]);
    setComposerOpen(false);
    setTitle("");
    setBody("");
    setNotice("内容已发布到社区，本次会话内可见");
  }

  return (
    <div className="page-wrap community-page">
      <header className="community-header">
        <div>
          <span className="eyebrow">STORY COMMUNITY</span>
          <h1>社区</h1>
          <p>分享走过的分支，也和同样喜欢故事的人聊几句。</p>
        </div>
        <button className="button primary" onClick={() => openComposer("discussion")}><PenLine size={17} />发布内容</button>
      </header>

      <section className="community-intro">
        <div className="community-intro-copy"><span className="section-label">A PLACE TO TALK</span><h2>故事走完以后，<br />还有人和你一起回味。</h2><p>这里适合留下一个选择、一条线索，或一句只想和读者分享的话。</p><div className="community-intro-actions"><button className="button pale" onClick={() => openComposer("share")}><Bookmark size={16} />分享喜欢的作品</button><span><Users size={16} />今日有 128 位读者正在交流</span></div></div>
        <div className="community-intro-stats"><div><strong>2.4k</strong><span>本周讨论</span></div><div><strong>8.6k</strong><span>作品分享</span></div><div><strong>96%</strong><span>友善交流</span></div></div>
      </section>

      <div className="community-layout">
        <main className="community-main">
          <div className="community-toolbar"><div className="community-tabs"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>全部</button><button className={filter === "share" ? "active" : ""} onClick={() => setFilter("share")}><Bookmark size={15} />作品分享</button><button className={filter === "discussion" ? "active" : ""} onClick={() => setFilter("discussion")}><MessageCircle size={15} />讨论</button></div><label className="community-sort"><span>排序</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="latest">最新发布</option><option value="popular">最受欢迎</option></select></label></div>
          <form className="community-search" onSubmit={(event) => event.preventDefault()}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索帖子、作品或话题" aria-label="搜索社区内容" />{query ? <button type="button" aria-label="清除搜索" onClick={() => setQuery("")}><X size={15} /></button> : null}</form>
          {notice ? <div className="community-notice"><Sparkles size={15} />{notice}<button onClick={() => setNotice("")} aria-label="关闭提示"><X size={14} /></button></div> : null}
          <div className="community-feed">{visiblePosts.map((post) => <article className="community-post" key={post.id}><div className="community-post-head"><div className="community-avatar">{post.avatar}</div><div><strong>{post.author}</strong><span>{post.role} · {post.createdAt}</span></div><span className={`community-kind ${post.kind}`}>{kindLabels[post.kind]}</span></div><div className="community-post-copy"><h2>{post.title}</h2><p>{post.body}</p></div><div className="community-post-tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>{post.story ? <Link href={`/stories/${post.story.slug}`} className="community-story-ref"><span className={`community-story-cover ${post.story.coverUrl ? "has-image" : ""}`}>{post.story.coverUrl ? <img src={post.story.coverUrl} alt="" /> : <b>{post.story.title.slice(0, 1)}</b>}</span><span><small>正在分享作品</small><strong>{post.story.title}</strong><em>作者 · {post.story.authorName}</em></span><ChevronRight size={17} /></Link> : null}<div className="community-post-actions"><button className={liked.includes(post.id) ? "liked" : ""} onClick={() => toggleLike(post.id)}><Heart size={16} fill={liked.includes(post.id) ? "currentColor" : "none"} />{post.likes + (liked.includes(post.id) ? 1 : 0)}</button><button onClick={() => openComposer("discussion", post.story)}><MessageCircle size={16} />{post.comments} 条讨论</button><button className="community-share-action" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}${post.story ? `/stories/${post.story.slug}` : "/community"}`); setNotice("链接已复制，可以分享给朋友"); }}><Send size={15} />分享</button></div></article>)}</div>
          {!visiblePosts.length ? <div className="empty-state"><MessageCircle size={30} /><h3>还没有找到相关内容</h3><p>换个关键词，或者成为第一个开启这个话题的人。</p><button className="button ghost small" onClick={() => openComposer("discussion")}><Plus size={15} />发布讨论</button></div> : null}
        </main>
        <aside className="community-aside"><section className="community-aside-card community-rules"><span className="eyebrow">COMMUNITY NOTES</span><h2>先分享感受，<br />再分享答案。</h2><p>尊重不同选择，不在标题和首段剧透关键结局。让每个人都能按自己的节奏走进故事。</p><button className="text-button" onClick={() => setNotice("社区守则：友善交流，避免剧透，尊重作者")} >查看社区守则 <ChevronRight size={15} /></button></section><section className="community-aside-card"><div className="aside-heading"><h3>正在升温的话题</h3><Flame size={17} /></div><Link href="/community?topic=无剧透讨论"><span># 无剧透讨论</span><small>326 条内容</small></Link><Link href="/community?topic=结局分享"><span># 结局分享</span><small>184 条内容</small></Link><Link href="/community?topic=家居类剧情"><span># 家居类剧情</span><small>92 条内容</small></Link></section><section className="community-aside-card community-creator-card"><Sparkles size={19} /><h3>你也有想分享的故事吗？</h3><p>从一段经历、一条线索开始，让它被更多人走到。</p><Link href="/studio" className="button ghost small">去创作中心</Link></section></aside>
      </div>

      {composerOpen ? <div className="composer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setComposerOpen(false); }}><section className="community-composer" role="dialog" aria-modal="true" aria-labelledby="composer-title"><div className="composer-heading"><div><span className="eyebrow">SHARE YOUR THOUGHTS</span><h2 id="composer-title">发布到社区</h2></div><button className="icon-button" onClick={() => setComposerOpen(false)} aria-label="关闭发布窗口"><X size={18} /></button></div><div className="composer-kind-switch"><button className={kind === "share" ? "active" : ""} onClick={() => setKind("share")}><Bookmark size={15} />分享作品</button><button className={kind === "discussion" ? "active" : ""} onClick={() => setKind("discussion")}><MessageCircle size={15} />发起讨论</button></div><form onSubmit={publish}><label>标题<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === "share" ? "说说你为什么喜欢这部作品" : "给这次讨论起一个标题"} maxLength={60} /></label>{kind === "share" ? <label>关联作品<select value={selectedStorySlug} onChange={(event) => { setSelectedStorySlug(event.target.value); const story = shareStories.find((item) => item.slug === event.target.value); if (story && !title) setTitle(`推荐《${story.title}》`); }}>{shareStories.map((story) => <option key={story.slug} value={story.slug}>{story.title} · {story.authorName}</option>)}</select></label> : null}<label>内容<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={kind === "share" ? "可以分享你的感受、喜欢的分支或推荐理由" : "把你的问题、线索或想法写下来"} rows={5} maxLength={500} /></label><div className="composer-footer"><span>{body.length}/500 · 发布后本次会话内可见</span><button className="button primary" type="submit"><Send size={16} />发布内容</button></div></form></section></div> : null}
    </div>
  );
}
