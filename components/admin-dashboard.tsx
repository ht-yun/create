"use client";

import { Activity, BarChart3, BookOpen, CheckCircle2, CircleAlert, FileText, MessageSquare, Search, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_URL, compactCount } from "@/lib/api";

type DashboardData = {
  metrics: {
    totalUsers: number; verifiedUsers: number; activeUsers: number;
    totalStories: number; publishedStories: number; draftStories: number;
    totalPlays: number; totalFavorites: number; totalPosts: number; totalComments: number;
  };
  activity: Array<{ day: string; users: number; stories: number; posts: number }>;
  recentUsers: Array<{ id: string; display_name: string; email: string; role: string; email_verified_at: string | null; created_at: string }>;
  recentStories: Array<{ id: string; title: string; slug: string; author_name: string; status: string; visibility: string; play_count: number; favorite_count: number }>;
  recentPosts: Array<{ id: string; title: string; kind: string; status: string; likes_count: number; comment_count: number; author_name: string }>;
};

const emptyData: DashboardData = {
  metrics: { totalUsers: 0, verifiedUsers: 0, activeUsers: 0, totalStories: 0, publishedStories: 0, draftStories: 0, totalPlays: 0, totalFavorites: 0, totalPosts: 0, totalComments: 0 },
  activity: [], recentUsers: [], recentStories: [], recentPosts: [],
};

const demoData: DashboardData = {
  metrics: { totalUsers: 1284, verifiedUsers: 1172, activeUsers: 386, totalStories: 96, publishedStories: 74, draftStories: 22, totalPlays: 218640, totalFavorites: 48620, totalPosts: 342, totalComments: 1268 },
  activity: ["10-15", "10-16", "10-17", "10-18", "10-19", "10-20", "10-21"].map((day, index) => ({ day, users: 28 + index * 7, stories: 3 + (index % 4), posts: 12 + index * 3 })),
  recentUsers: [
    { id: "demo-1", display_name: "林间小鹿", email: "deer@example.com", role: "user", email_verified_at: "2026-10-21", created_at: "2026-10-21" },
    { id: "demo-2", display_name: "青篁", email: "qing@example.com", role: "admin", email_verified_at: "2026-10-20", created_at: "2026-10-20" },
    { id: "demo-3", display_name: "南栀", email: "nan@example.com", role: "user", email_verified_at: null, created_at: "2026-10-19" },
  ],
  recentStories: [
    { id: "demo-story-1", title: "雨夜来客", slug: "rain-night-visitor", author_name: "青篁", status: "published", visibility: "public", play_count: 24860, favorite_count: 6832 },
    { id: "demo-story-2", title: "晚风替我说", slug: "evening-breeze-says", author_name: "南栀", status: "published", visibility: "public", play_count: 31720, favorite_count: 10431 },
  ],
  recentPosts: [
    { id: "demo-post-1", title: "你最喜欢哪个结局？", kind: "discussion", status: "published", likes_count: 82, comment_count: 24, author_name: "林间小鹿" },
    { id: "demo-post-2", title: "分享一个雨夜氛围歌单", kind: "share", status: "published", likes_count: 46, comment_count: 9, author_name: "青篁" },
  ],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(new Date(value));
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof Users; label: string; value: string; note: string; tone: string }) {
  return <article className={`admin-metric ${tone}`}><div className="admin-metric-icon"><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "offline">("loading");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/admin/overview`, { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) { setState("forbidden"); return; }
        if (!response.ok) throw new Error("dashboard request failed");
        setData(await response.json() as DashboardData); setState("ready");
      })
      .catch(() => { setData(demoData); setState("offline"); });
  }, []);

  const maxActivity = useMemo(() => Math.max(1, ...data.activity.map((item) => item.users + item.stories + item.posts)), [data.activity]);

  if (state === "forbidden") {
    return <section className="page-wrap admin-page"><div className="admin-access-card"><div className="admin-access-icon"><ShieldCheck size={28} /></div><span className="eyebrow">ADMIN CONSOLE</span><h1>管理后台</h1><p>当前账号没有管理员权限。请使用管理员邮箱注册并完成验证，然后在后端环境变量 <code>ADMIN_EMAILS</code> 中配置该邮箱。</p><a className="button primary" href="/auth">切换管理员账号</a></div></section>;
  }

  const metrics = data.metrics;
  return <section className="page-wrap admin-page">
    <header className="admin-header"><div><span className="eyebrow">ADMIN CONSOLE · 数据中台</span><h1>管理后台</h1><p>从用户、作品到社区互动，快速掌握平台当前状态。</p></div><div className="admin-status"><ShieldCheck size={17} />管理员模式</div></header>
    {state === "offline" ? <div className="admin-demo-note"><CircleAlert size={16} />当前 API 不可用，以下为演示数据；连接后台后会自动替换为真实统计。</div> : null}
    <div className="admin-metrics">
      <Metric icon={Users} label="注册用户" value={compactCount(metrics.totalUsers)} note={`${compactCount(metrics.verifiedUsers)} 个已验证`} tone="green" />
      <Metric icon={BookOpen} label="公开作品" value={compactCount(metrics.publishedStories)} note={`${metrics.totalStories} 个作品总量`} tone="blue" />
      <Metric icon={MessageSquare} label="社区内容" value={compactCount(metrics.totalPosts + metrics.totalComments)} note={`${metrics.totalPosts} 帖子 · ${metrics.totalComments} 评论`} tone="orange" />
      <Metric icon={Activity} label="累计游玩" value={compactCount(metrics.totalPlays)} note={`${compactCount(metrics.totalFavorites)} 次收藏`} tone="purple" />
    </div>
    <div className="admin-main-grid">
      <article className="admin-panel admin-activity"><div className="admin-panel-heading"><div><span className="eyebrow">LAST 7 DAYS</span><h2>平台活动趋势</h2></div><BarChart3 size={20} /></div><div className="admin-chart">{data.activity.map((item) => <div className="admin-chart-column" key={item.day}><div className="admin-bar-stack" title={`用户 ${item.users} · 作品 ${item.stories} · 帖子 ${item.posts}`}><i style={{ height: `${Math.max(8, item.users / maxActivity * 100)}%` }} /><b style={{ height: `${Math.max(5, item.stories / maxActivity * 100)}%` }} /><em style={{ height: `${Math.max(5, item.posts / maxActivity * 100)}%` }} /></div><small>{item.day}</small></div>)}</div><div className="admin-chart-legend"><span><i className="legend-users" />用户</span><span><i className="legend-stories" />作品</span><span><i className="legend-posts" />社区</span></div></article>
      <article className="admin-panel admin-health"><div className="admin-panel-heading"><div><span className="eyebrow">QUICK HEALTH</span><h2>运行概览</h2></div><CheckCircle2 size={20} /></div><div className="health-row"><span>活跃用户（30 天）</span><strong>{metrics.activeUsers}</strong></div><div className="health-row"><span>草稿作品</span><strong>{metrics.draftStories}</strong></div><div className="health-row"><span>用户验证率</span><strong>{metrics.totalUsers ? `${Math.round(metrics.verifiedUsers / metrics.totalUsers * 100)}%` : "—"}</strong></div><div className="health-foot"><CheckCircle2 size={15} />数据服务运行正常</div></article>
    </div>
    <div className="admin-section-heading"><div><span className="eyebrow">RECENT DATA</span><h2>最近数据</h2></div><label className="admin-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="筛选展示内容" /></label></div>
    <div className="admin-tables"><article className="admin-panel"><div className="admin-panel-heading"><h3><Users size={17} />最近注册用户</h3><span>{data.recentUsers.length} 条</span></div>{data.recentUsers.filter((user) => `${user.display_name}${user.email}`.includes(search)).map((user) => <div className="admin-list-row" key={user.id}><span className="table-avatar">{user.display_name.slice(0, 1)}</span><div><strong>{user.display_name}</strong><small>{user.email}</small></div><span className={user.email_verified_at ? "status-pill success" : "status-pill muted"}>{user.email_verified_at ? "已验证" : "待验证"}</span></div>)}</article><article className="admin-panel"><div className="admin-panel-heading"><h3><FileText size={17} />最近作品</h3><span>{data.recentStories.length} 条</span></div>{data.recentStories.filter((story) => `${story.title}${story.author_name}`.includes(search)).map((story) => <div className="admin-list-row" key={story.id}><div className="admin-list-copy"><strong>{story.title}</strong><small>{story.author_name} · {compactCount(story.play_count)} 次游玩</small></div><span className="status-pill success">{story.status === "published" ? "已发布" : "草稿"}</span></div>)}</article><article className="admin-panel"><div className="admin-panel-heading"><h3><MessageSquare size={17} />最近社区内容</h3><span>{data.recentPosts.length} 条</span></div>{data.recentPosts.filter((post) => `${post.title}${post.author_name}`.includes(search)).map((post) => <div className="admin-list-row" key={post.id}><div className="admin-list-copy"><strong>{post.title}</strong><small>{post.author_name} · {post.comment_count} 条评论</small></div><span className="status-pill orange">{post.kind === "share" ? "作品分享" : "讨论"}</span></div>)}</article></div>
  </section>;
}
