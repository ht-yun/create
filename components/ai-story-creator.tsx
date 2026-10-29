"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Bot, Check, CircleAlert, FileText, GitBranch, LoaderCircle, MessageCircleQuestion, PenLine, Sparkles, WandSparkles } from "lucide-react";
import type { AiStoryPreferences, AiStorySession } from "@/shared/ai-story-contract";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const initialPreferences: AiStoryPreferences = { estimatedMinutes: 15, endingCount: 2, useVariables: true, genre: "悬疑", tone: "克制、有余韵", audience: "青少年及以上" };

export function AiStoryCreator() {
  const [idea, setIdea] = useState("");
  const [preferences, setPreferences] = useState(initialPreferences);
  const [session, setSession] = useState<AiStorySession>();
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function request(path: string, options: RequestInit = {}) {
    setError("");
    const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers: { "content-type": "application/json", ...(options.headers ?? {}) } });
    const body = await response.json().catch(() => ({})) as AiStorySession & { message?: string };
    if (!response.ok) throw new Error(response.status === 401 ? "请先登录后使用 AI 辅助创作" : body.message || "AI 创作请求失败");
    setSession(body);
    return body;
  }

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(label);
    setError("");
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "操作失败，请稍后重试"); } finally { setBusy(""); }
  }

  function start() {
    void run("正在理解故事想法…", () => request("/ai/story-sessions", { method: "POST", body: JSON.stringify({ idea, preferences }) }));
  }

  function submitAnswer(value = answer) {
    if (!session || !value.trim()) return;
    void run("正在整理回答…", async () => {
      await request(`/ai/story-sessions/${session.id}/messages`, { method: "POST", body: JSON.stringify({ answer: value.trim() }) });
      setAnswer("");
    });
  }

  const phaseStep = session?.phase === "applied" ? 4 : session?.phase === "generated" ? 3 : session?.phase === "outline" ? 2 : session ? 1 : 0;

  return <main className="ai-creator-page">
    <header className="ai-creator-topbar"><Link href="/studio" className="icon-button" aria-label="返回创作中心"><ArrowLeft size={18} /></Link><div><span className="eyebrow">AI STORY STUDIO</span><strong>AI 辅助创作</strong></div><div className="ai-stepper">{["故事想法", "采访完善", "确认大纲", "生成节点"].map((item, index) => <span key={item} className={phaseStep >= index ? "active" : ""}><i>{phaseStep > index ? <Check size={11} /> : index + 1}</i>{item}</span>)}</div></header>

    {!session ? <section className="ai-idea-stage">
      <div className="ai-idea-intro"><span><Sparkles size={18} />从一个模糊想法开始</span><h1>先说个大概，<br />剩下的由 AI 陪你想清楚。</h1><p>不需要先准备完整大纲。AI 会一次问一个关键问题，整理成故事设定卡和分支大纲，最后再创建可编辑的节点。</p><div className="ai-promise-list"><span><MessageCircleQuestion size={17} /><b>最多五个问题</b><small>只追问真正影响故事结构的内容</small></span><span><GitBranch size={17} /><b>先确认再生成</b><small>不会直接覆盖已有作品或节点</small></span><span><PenLine size={17} /><b>生成后仍可编辑</b><small>结果会保存为私有草稿</small></span></div></div>
      <div className="ai-idea-card"><label className="ai-main-input"><span>你的故事想法</span><textarea value={idea} onChange={(event) => setIdea(event.target.value)} rows={9} maxLength={5000} placeholder="例如：一个女孩在放学路上捡到一封来自十年后的信，信中提醒她今天不要回家……" /><small>{idea.length}/5000 · 至少输入 20 个字</small></label><div className="ai-preference-grid"><label>类型<input value={preferences.genre ?? ""} onChange={(event) => setPreferences({ ...preferences, genre: event.target.value })} /></label><label>氛围<input value={preferences.tone ?? ""} onChange={(event) => setPreferences({ ...preferences, tone: event.target.value })} /></label><label>预计时长<select value={preferences.estimatedMinutes} onChange={(event) => setPreferences({ ...preferences, estimatedMinutes: Number(event.target.value) })}><option value={5}>5 分钟</option><option value={15}>15 分钟</option><option value={30}>30 分钟</option><option value={60}>60 分钟</option></select></label><label>结局数量<select value={preferences.endingCount} onChange={(event) => setPreferences({ ...preferences, endingCount: Number(event.target.value) })}><option value={2}>2 个结局</option><option value={3}>3 个结局</option></select></label></div><label className="ai-variable-toggle"><span><b>使用故事变量</b><small>让选择改变勇气、信任等状态</small></span><input type="checkbox" checked={preferences.useVariables} onChange={(event) => setPreferences({ ...preferences, useVariables: event.target.checked })} /></label>{error ? <ErrorNotice message={error} /> : null}<button className="button primary ai-start-button" disabled={idea.trim().length < 20 || Boolean(busy)} onClick={start}>{busy ? <LoaderCircle className="spin" size={17} /> : <WandSparkles size={17} />}{busy || "开始完善故事"}</button></div>
    </section> : <section className="ai-workspace">
      <div className="ai-conversation-panel"><div className="ai-panel-heading"><div><span className="eyebrow">CREATIVE INTERVIEW</span><h2>故事采访</h2></div><span className={`ai-provider-badge ${session.provider === "guided-template" ? "fallback" : ""}`}><Bot size={14} />{session.provider === "guided-template" ? "引导演示模式" : "AI 已连接"}</span></div>{session.provider === "guided-template" ? <p className="ai-provider-note">当前未配置模型密钥，系统使用内置引导器完成流程。配置后会自动切换为 AI 动态提问。</p> : null}<div className="ai-messages">{session.messages.map((message) => <article key={message.id} className={message.role}><span>{message.role === "assistant" ? <Bot size={15} /> : "你"}</span><p>{message.content}</p></article>)}</div>
        {session.phase === "interview" && session.question ? <div className="ai-question-box"><strong>{session.question.prompt}</strong><div>{session.question.options.map((option) => <button key={option} disabled={Boolean(busy)} onClick={() => submitAnswer(option)}>{option}<ArrowRight size={14} /></button>)}</div>{session.question.allowCustom ? <label><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={3} placeholder="也可以写下自己的答案……" /><button disabled={!answer.trim() || Boolean(busy)} onClick={() => submitAnswer()}>{busy ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />}</button></label> : null}</div> : null}
        {session.ready && session.phase === "interview" ? <ActionCard icon={FileText} title="设定信息已经足够" description="下一步先生成可阅读的大纲，不会立即创建节点。" busy={busy} button="生成剧情大纲" onClick={() => void run("正在生成大纲…", () => request(`/ai/story-sessions/${session.id}/outline`, { method: "POST" }))} /> : null}
        {session.phase === "outline" ? <ActionCard icon={GitBranch} title="确认大纲后生成节点" description="节点会先进入临时预览，确认后才创建私有草稿。" busy={busy} button="生成故事节点" onClick={() => void run("正在生成节点…", () => request(`/ai/story-sessions/${session.id}/generate`, { method: "POST" }))} /> : null}
        {session.phase === "generated" ? <ActionCard icon={WandSparkles} title="节点图已通过结构校验" description="确认后创建新作品，不会覆盖任何已有草稿。" busy={busy} button="确认并创建私有草稿" onClick={() => void run("正在创建草稿…", () => request(`/ai/story-sessions/${session.id}/apply`, { method: "POST" }))} /> : null}
        {session.phase === "applied" && session.story ? <div className="ai-created-card"><Check size={22} /><div><strong>《{session.story.title}》已创建</strong><span>已保存为私有草稿，可以继续修改节点、正文和素材。</span></div><Link className="button primary" href={`/studio/editor?storyId=${session.story.id}&aiSession=${session.id}`}>进入节点编辑器 <ArrowRight size={16} /></Link></div> : null}
        {error ? <ErrorNotice message={error} /> : null}
      </div>
      <aside className="ai-result-panel"><BriefCard session={session} />{session.outline ? <OutlineCard session={session} /> : null}{session.draftGraph ? <GraphCard session={session} /> : null}</aside>
    </section>}
  </main>;
}

function BriefCard({ session }: { session: AiStorySession }) {
  const fields = [["主角", session.brief.protagonist], ["目标", session.brief.goal], ["阻力", session.brief.conflict], ["核心选择", session.brief.keyChoice], ["结局感受", session.brief.endingDirection]];
  return <section className="ai-result-card"><span className="eyebrow">STORY BRIEF</span><h2>故事设定卡</h2><p className="ai-brief-idea">{session.brief.idea}</p><dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "等待补充"}</dd></div>)}</dl><div className="ai-brief-meta"><span>{session.preferences.estimatedMinutes} 分钟</span><span>{session.preferences.endingCount} 个结局</span><span>{session.preferences.useVariables ? "包含变量" : "无变量"}</span></div></section>;
}

function OutlineCard({ session }: { session: AiStorySession }) {
  const outline = session.outline!;
  return <section className="ai-result-card ai-outline-card"><span className="eyebrow">STORY OUTLINE</span><h2>{outline.title}</h2><p>{outline.summary}</p><div className="ai-outline-acts">{outline.acts.map((act, index) => <div key={act.title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{act.title}</strong><p>{act.description}</p></div>)}</div><div className="ai-ending-list"><strong>结局方向</strong>{outline.endings.map((ending) => <span key={ending.title}>{ending.title}</span>)}</div></section>;
}

function GraphCard({ session }: { session: AiStorySession }) {
  const graph = session.draftGraph!;
  return <section className="ai-result-card ai-graph-card"><span className="eyebrow">NODE PREVIEW</span><h2>临时节点图</h2><div className="ai-graph-stats"><span><b>{graph.nodes.length}</b>节点</span><span><b>{graph.nodes.filter((node) => node.type === "ending").length}</b>结局</span><span><b>{graph.variables.length}</b>变量</span></div><div className="ai-node-preview">{graph.nodes.map((node) => <span key={node.id} className={node.type}><i />{node.title}<small>{node.type === "ending" ? "结局" : node.type === "choice" ? `${node.choices?.length ?? 0} 个选择` : "场景"}</small></span>)}</div></section>;
}

function ActionCard({ icon: Icon, title, description, busy, button, onClick }: { icon: typeof Sparkles; title: string; description: string; busy: string; button: string; onClick: () => void }) {
  return <div className="ai-action-card"><Icon size={20} /><div><strong>{title}</strong><span>{description}</span></div><button className="button primary" disabled={Boolean(busy)} onClick={onClick}>{busy ? <LoaderCircle className="spin" size={16} /> : null}{busy || button}</button></div>;
}

function ErrorNotice({ message }: { message: string }) { return <p className="ai-error"><CircleAlert size={15} />{message}{message.includes("登录") ? <Link href={`/auth?returnTo=${encodeURIComponent("/studio/ai")}`}>前往登录</Link> : null}</p>; }
