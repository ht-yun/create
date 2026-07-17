"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, ChevronRight, GitFork, Headphones, History, Home, RotateCcw, Share2, Sparkles, Volume2 } from "lucide-react";
import type { StoryChoice, StoryCondition, StoryDetail, StoryNode, VariableChange } from "@/shared/story-contract";

type VariableState = Record<string, number | boolean | string>;
type HistoryEntry = { nodeId: string; variables: VariableState; choiceLabel?: string };

function passes(condition: StoryCondition, variables: VariableState) {
  const current = variables[condition.variable]; const target = condition.value;
  if (condition.operator === "eq") return current === target;
  if (condition.operator === "neq") return current !== target;
  if (typeof current !== "number" || typeof target !== "number") return false;
  return condition.operator === "gt" ? current > target : condition.operator === "gte" ? current >= target : condition.operator === "lt" ? current < target : current <= target;
}

function applyChanges(current: VariableState, changes: VariableChange[] = []) {
  const next = { ...current };
  for (const change of changes) {
    if (change.operation === "set") next[change.key] = change.value;
    else if (typeof next[change.key] === "number" && typeof change.value === "number") next[change.key] = change.operation === "add" ? Number(next[change.key]) + change.value : Number(next[change.key]) - change.value;
  }
  return next;
}

export function StoryPlayer({ story }: { story: StoryDetail }) {
  const initialVariables = useMemo(() => Object.fromEntries(story.graph.variables.map((variable) => [variable.key, variable.initialValue])), [story]);
  const nodes = useMemo(() => new Map(story.graph.nodes.map((node) => [node.id, node])), [story]);
  const [currentId, setCurrentId] = useState(story.graph.startNodeId);
  const [variables, setVariables] = useState<VariableState>(initialVariables);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notice, setNotice] = useState("");
  const current = nodes.get(currentId) as StoryNode;
  const choices = (current.choices ?? []).filter((choice) => (choice.conditions ?? []).every((condition) => passes(condition, variables)));
  const progress = Math.min(100, Math.round(((new Set([...history.map((item) => item.nodeId), currentId]).size) / story.graph.nodes.length) * 100));

  function choose(choice: StoryChoice) {
    setHistory((items) => [...items, { nodeId: currentId, variables: { ...variables }, choiceLabel: choice.label }]);
    setVariables(applyChanges(variables, choice.changes)); setCurrentId(choice.targetNodeId);
  }
  function continueTo(target: string) { setHistory((items) => [...items, { nodeId: currentId, variables: { ...variables } }]); setCurrentId(target); }
  function jump(index: number) { const entry = history[index]; setCurrentId(entry.nodeId); setVariables(entry.variables); setHistory((items) => items.slice(0, index)); setShowHistory(false); }
  function restart() { setCurrentId(story.graph.startNodeId); setVariables(initialVariables); setHistory([]); }
  async function shareStory() {
    const shareData = { title: story.title, text: story.summary, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setNotice("剧情链接已复制");
      }
    } catch {
      // Closing the native share panel does not need an error message.
    }
  }

  return (
    <main className={`player-page player-${story.slug === "evening-breeze-says" ? "rose" : "rain"}`}>
      <header className="player-header"><Link href="/workshop"><ArrowLeft size={18} />退出剧情</Link><div><span>{story.title}</span><i><b style={{ width: `${progress}%` }} /></i><small>{progress}%</small></div><nav><button aria-label={soundEnabled ? "关闭声音" : "开启声音"} aria-pressed={soundEnabled} className={soundEnabled ? "active" : ""} onClick={() => { setSoundEnabled((value) => !value); setNotice(soundEnabled ? "环境音已关闭" : "环境音已开启"); }}><Volume2 size={18} /></button><Link aria-label="登录后收藏" href={`/auth?returnTo=${encodeURIComponent(`/stories/${story.slug}`)}`}><Bookmark size={18} /></Link><button aria-label="分享剧情" onClick={shareStory}><Share2 size={18} /></button></nav></header>
      {notice ? <button className="player-notice" onClick={() => setNotice("")} aria-label="关闭提示">{notice}</button> : null}
      <section className="player-stage">
        <aside className="player-variables"><span>故事状态</span>{story.graph.variables.map((definition) => { const numeric = typeof variables[definition.key] === "number" ? Number(variables[definition.key]) : 0; const ratio = definition.max ? Math.max(0, Math.min(100, (numeric / definition.max) * 100)) : 0; return <div key={definition.key}><p><b>{definition.label}</b><small>{String(variables[definition.key])}</small></p>{definition.type === "number" ? <i><b style={{ width: `${ratio}%` }} /></i> : null}</div>; })}<button onClick={() => setShowHistory((value) => !value)}><History size={16} />走过的分支 <span>{history.length}</span></button></aside>
        {showHistory ? <aside className="history-panel"><div><strong>走过的分支</strong><button onClick={() => setShowHistory(false)}>×</button></div><p>返回任一经过的节点，之后的选择和数值会一同恢复。</p>{history.map((entry, index) => <button key={`${entry.nodeId}-${index}`} onClick={() => jump(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{nodes.get(entry.nodeId)?.title}</strong><small>{entry.choiceLabel ?? "继续剧情"}</small></div><ChevronRight size={15} /></button>)}</aside> : null}
        <article className="narrative-card"><div className="narrative-top"><span>{current.type === "ending" ? "ENDING" : `SCENE ${String(history.length + 1).padStart(2, "0")}`}</span><small><Headphones size={14} />环境音 · {story.slug === "rain-night-visitor" ? "竹雨" : "晚风与站台"}</small></div><div className="scene-emblem" aria-hidden="true"><span>{current.type === "ending" ? "终" : story.title.slice(0, 1)}</span></div><div className="narrative-copy"><span>{current.speaker ?? "旁白"}</span><h1>{current.title}</h1><p>{current.content}</p></div>
          {current.type === "ending" ? <div className="ending-actions"><span><Sparkles size={17} />已抵达结局 · {current.title}</span><div><button className="button primary" onClick={restart}><RotateCcw size={16} />重新开始</button><Link className="button ghost" href="/workshop"><Home size={16} />返回工坊</Link></div></div> : <div className="player-choices">{choices.map((choice, index) => <button key={choice.id} onClick={() => choose(choice)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{choice.label}</strong><small>{choice.changes?.map((change) => `${story.graph.variables.find((item) => item.key === change.key)?.label ?? change.key} ${change.operation === "add" ? "+" : change.operation === "subtract" ? "−" : "="}${change.value}`).join(" · ")}</small><ChevronRight size={18} /></button>)}{!choices.length && current.nextNodeId ? <button onClick={() => continueTo(current.nextNodeId!)}><span>→</span><strong>继续</strong><ChevronRight size={18} /></button> : null}</div>}
        </article>
        <div className="player-branch-note"><GitFork size={15} />本段共有 {story.endingCount} 个结局；你可以随时返回已走过的分支点。</div>
      </section>
    </main>
  );
}
