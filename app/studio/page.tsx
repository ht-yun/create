import Link from "next/link";
import { ArrowRight, BookOpenCheck, Boxes, CirclePlus, Clock3, FileText, ImagePlus, MoreHorizontal, Play, Sparkles, WandSparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StoryPackageActions } from "@/components/story-package-actions";

export const metadata = { title: "创作中心" };

const modes = [
  { icon: Sparkles, level: "01", title: "引导模式", description: "用问答和章节卡片完成第一部作品，系统负责连接节点。", meta: "适合第一次创作" },
  { icon: Boxes, level: "02", title: "标准模式", description: "使用可视化节点、变量与条件，掌控主要分支结构。", meta: "推荐大多数创作者" },
  { icon: WandSparkles, level: "03", title: "专业模式", description: "开放表达式、复用子图、批量工具和完整发布检查。", meta: "适合复杂长篇" },
];

export default function StudioPage() {
  return (
    <AppShell active="studio"><div className="page-wrap studio-page">
      <StoryPackageActions />
      <header className="workshop-header"><div><span className="eyebrow">CREATOR STUDIO</span><h1>创作中心</h1><p>把文字、声音和画面连接成可以亲自走过的故事。</p></div><Link href="/studio/editor" className="button primary"><CirclePlus size={17} />新建作品</Link></header>
      <section className="studio-overview"><div><span>草稿</span><strong>2</strong><small>1 部本周有更新</small></div><div><span>已发布</span><strong>0</strong><small>完成首作后会显示在这里</small></div><div><span>总体验</span><strong>—</strong><small>发布后开始统计</small></div><div className="studio-tip"><BookOpenCheck size={21} /><p><strong>创作提示</strong>先写出主线，再补充分支；每个选择都应该让体验者知道自己在为什么做决定。</p></div></section>
      <section className="content-section flush"><div className="section-heading"><div><span className="eyebrow">START HERE</span><h2>选择创作方式</h2><p>模式只改变编辑体验，不会限制作品功能，可随时升级。</p></div></div><div className="mode-grid">{modes.map((mode) => { const Icon = mode.icon; return <Link href={`/studio/editor?mode=${mode.level}`} className="mode-card" key={mode.level}><span className="mode-level">{mode.level}</span><Icon size={25} /><h3>{mode.title}</h3><p>{mode.description}</p><small>{mode.meta}</small><ArrowRight size={18} /></Link>; })}</div></section>
      <section className="content-section flush" id="recent-projects"><div className="section-heading"><div><span className="eyebrow">RECENT PROJECTS</span><h2>最近编辑</h2></div><Link className="text-button" href="#recent-projects">查看全部 <ArrowRight size={15} /></Link></div><div className="project-list">
        <article className="project-row"><div className="project-cover rain">雨</div><div><span className="draft-badge">草稿</span><h3>雨夜来客</h3><p>7 个节点 · 3 个结局 · 上次编辑于 12 分钟前</p></div><span className="project-progress"><i style={{ width: "72%" }} />结构完成 72%</span><Link href="/studio/editor"><FileText size={16} />继续编辑</Link><button aria-label="更多操作（暂未开放）" title="更多操作将在下一版本开放" disabled><MoreHorizontal size={18} /></button></article>
        <article className="project-row"><div className="project-cover rose">晚</div><div><span className="draft-badge">草稿</span><h3>晚风替我说</h3><p>7 个节点 · 3 个结局 · 上次编辑于昨天</p></div><span className="project-progress"><i style={{ width: "48%" }} />结构完成 48%</span><Link href="/studio/editor"><FileText size={16} />继续编辑</Link><button aria-label="更多操作（暂未开放）" title="更多操作将在下一版本开放" disabled><MoreHorizontal size={18} /></button></article>
      </div></section>
      <section className="asset-callout"><div className="asset-icon"><ImagePlus size={25} /></div><div><span className="section-label">素材库</span><h3>图片、音频和视频统一管理</h3><p>上传后可在多个节点复用；正式接入对象存储后会自动生成缩略图与转码版本。</p></div><Link href="/studio/editor" className="button ghost">打开素材库 <ArrowRight size={16} /></Link><div className="asset-facts"><span><Clock3 size={14} />保留处理状态</span><span><Play size={14} />支持预览</span></div></section>
    </div></AppShell>
  );
}
