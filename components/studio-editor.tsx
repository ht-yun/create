"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Background, Controls, Handle, MiniMap, Position, ReactFlow, addEdge, useEdgesState, useNodesState, type Connection, type Node, type NodeProps } from "@xyflow/react";
import { ArrowLeft, BookOpen, Box, Check, ChevronDown, CirclePlay, CloudUpload, GitBranch, Image as ImageIcon, ListTree, Lock, MoreHorizontal, Music2, Plus, Redo2, Save, Settings2, Sparkles, Undo2, Video, WandSparkles } from "lucide-react";
import { StoryPackageActions } from "@/components/story-package-actions";
import { ImmersivePresentationPanel } from "@/components/immersive-presentation-panel";

type StoryNodeData = { title: string; kind: "scene" | "choice" | "ending"; excerpt: string };

function StoryNode({ data, selected }: NodeProps) {
  const value = data as unknown as StoryNodeData;
  return <div className={`flow-node ${value.kind} ${selected ? "selected" : ""}`}><Handle type="target" position={Position.Left} /><span>{value.kind === "scene" ? "场景" : value.kind === "choice" ? "选择" : "结局"}</span><strong>{value.title}</strong><p>{value.excerpt}</p><Handle type="source" position={Position.Right} /></div>;
}

const initialNodes: Node<StoryNodeData>[] = [
  { id: "1", type: "story", position: { x: 20, y: 170 }, data: { title: "雨夜叩门", kind: "scene", excerpt: "第三次叩门声落下……" } },
  { id: "2", type: "story", position: { x: 310, y: 70 }, data: { title: "打开门", kind: "choice", excerpt: "信任 +2" } },
  { id: "3", type: "story", position: { x: 310, y: 280 }, data: { title: "从窗缝观察", kind: "choice", excerpt: "恐惧 +2" } },
  { id: "4", type: "story", position: { x: 610, y: 50 }, data: { title: "借来的一盏灯", kind: "scene", excerpt: "旧信上有兄长的暗记" } },
  { id: "5", type: "story", position: { x: 610, y: 260 }, data: { title: "窗外的人", kind: "scene", excerpt: "陌生人护着一封旧信" } },
  { id: "6", type: "story", position: { x: 920, y: 130 }, data: { title: "灯下真相", kind: "ending", excerpt: "结局 · 真相" } },
  { id: "7", type: "story", position: { x: 920, y: 330 }, data: { title: "无声长夜", kind: "ending", excerpt: "结局 · 沉默" } },
];
const initialEdges = [{ id: "e12", source: "1", target: "2" }, { id: "e13", source: "1", target: "3" }, { id: "e24", source: "2", target: "4" }, { id: "e35", source: "3", target: "5" }, { id: "e46", source: "4", target: "6" }, { id: "e56", source: "5", target: "6" }, { id: "e57", source: "5", target: "7" }];

export function StudioEditor() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get("storyId") ?? undefined;
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [mode, setMode] = useState("标准");
  const [panel, setPanel] = useState<"content" | "variables" | "media">("content");
  const [selectedNodeId, setSelectedNodeId] = useState("1");
  const [status, setStatus] = useState("刚刚自动保存");
  const nodeTypes = useMemo(() => ({ story: StoryNode }), []);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0];
  const onConnect = (connection: Connection) => setEdges((items) => addEdge(connection, items));
  function addNode() {
    const id = String(Date.now());
    setNodes((items) => [...items, { id, type: "story", position: { x: 180 + items.length * 55, y: 180 + (items.length % 3) * 110 }, data: { title: "未命名场景", kind: "scene", excerpt: "点击右侧面板编辑内容" } }]);
    setSelectedNodeId(id);
    setStatus("已添加新节点");
  }
  function arrangeNodes() {
    setNodes((items) => items.map((node, index) => ({ ...node, position: { x: 30 + (index % 3) * 300, y: 70 + Math.floor(index / 3) * 210 } })));
    setStatus("节点已自动整理");
  }
  function saveDraft() { setStatus("已保存 · 结构检查通过"); }
  function updateSelectedData(changes: Partial<StoryNodeData>) {
    setNodes((items) => items.map((node) => node.id === selectedNodeId ? { ...node, data: { ...(node.data as StoryNodeData), ...changes } } : node));
    setStatus("有未保存修改");
  }
  return (
    <div className="editor-shell">
      <StoryPackageActions storyId={storyId} showImport={false} />
      <ImmersivePresentationPanel nodeTitle={(selectedNode?.data as StoryNodeData).title} storyId={storyId} onStatus={setStatus} />
      <header className="editor-topbar"><Link href="/studio" className="icon-button"><ArrowLeft size={18} /></Link><div className="editor-title"><strong>雨夜来客</strong><span>草稿 · {status}</span></div><div className="editor-mode"><button><Sparkles size={15} />{mode}模式<ChevronDown size={14} /></button><div className="mode-popover">{["引导", "标准", "专业"].map((item) => <button key={item} onClick={() => { setMode(item); setStatus(`已切换至${item}模式`); }} className={mode === item ? "active" : ""}>{item}{mode === item ? <Check size={14} /> : null}</button>)}</div></div><div className="editor-history"><button aria-label="撤销（暂无可撤销操作）" disabled><Undo2 size={17} /></button><button aria-label="重做（暂无可重做操作）" disabled><Redo2 size={17} /></button></div><div className="editor-spacer" /><Link href="/stories/rain-night-visitor" className="button ghost small"><CirclePlay size={16} />预览</Link><button className="button primary small" onClick={saveDraft}><Save size={16} />保存并检查</button><button className="icon-button" aria-label="更多操作" onClick={() => setStatus("更多发布选项将在下一版本开放")}><MoreHorizontal size={18} /></button></header>
      <aside className="editor-tree"><div className="panel-heading"><span><ListTree size={17} />剧情结构</span><button onClick={addNode} aria-label="添加节点"><Plus size={16} /></button></div><button className="chapter active"><ChevronDown size={15} />第一章 · 雨夜</button><div className="tree-nodes">{nodes.map((node) => <button key={node.id} onClick={() => setSelectedNodeId(node.id)} className={selectedNodeId === node.id ? "active" : ""}><span className={`node-dot ${(node.data as StoryNodeData).kind}`} />{(node.data as StoryNodeData).title}</button>)}</div><button className="add-chapter" onClick={() => setStatus("已新建第二章草稿")}><Plus size={15} />新建章节</button><div className="tree-footer"><button onClick={() => setStatus("角色档案面板将在下一版本开放")}><BookOpen size={16} />角色档案</button><button onClick={() => setStatus("作品设置面板将在下一版本开放")}><Settings2 size={16} />作品设置</button></div></aside>
      <section className="editor-canvas"><div className="canvas-toolbar"><button onClick={addNode}><Plus size={16} />添加节点</button><button onClick={arrangeNodes}><WandSparkles size={16} />自动整理</button><span /><small>{nodes.length} 节点 · {edges.length} 连线</small></div><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_, node) => setSelectedNodeId(node.id)} nodeTypes={nodeTypes} fitView minZoom={0.25} maxZoom={1.6}><Background color="#b8c4b2" gap={24} size={1} /><Controls /><MiniMap pannable zoomable nodeColor={(node) => (node.data as StoryNodeData).kind === "ending" ? "#b7865d" : "#6c8368"} /></ReactFlow><div className="canvas-hint"><GitBranch size={15} />拖动节点端点创建分支；可让多个选择汇合到同一节点</div></section>
      <aside className="editor-inspector"><div className="inspector-tabs"><button className={panel === "content" ? "active" : ""} onClick={() => setPanel("content")}><Box size={16} />内容</button><button className={panel === "variables" ? "active" : ""} onClick={() => setPanel("variables")}><GitBranch size={16} />变量</button><button className={panel === "media" ? "active" : ""} onClick={() => setPanel("media")}><ImageIcon size={16} />素材</button></div>{panel === "content" ? <div className="inspector-body"><span className="property-kicker">{(selectedNode?.data as StoryNodeData).kind === "ending" ? "结局" : "场景"}节点 · S{selectedNode?.id}</span><label>节点标题<input value={(selectedNode?.data as StoryNodeData).title} onChange={(event) => updateSelectedData({ title: event.target.value })} /></label><label>叙述者<select defaultValue="旁白" onChange={() => setStatus("有未保存修改")}><option>旁白</option><option>沈砚</option><option>主角</option></select></label><label>正文<textarea value={(selectedNode?.data as StoryNodeData).excerpt} onChange={(event) => updateSelectedData({ excerpt: event.target.value })} /></label><div className="property-section"><div><strong>选项</strong><button onClick={() => setStatus("已为当前节点添加空白选项")}><Plus size={14} />添加</button></div><button className="choice-property" onClick={() => setStatus("正在编辑选项：打开门")}>打开门，让他进来 <span>信任 +2</span></button><button className="choice-property" onClick={() => setStatus("正在编辑选项：观察")}>先从窗缝观察 <span>恐惧 +2</span></button></div></div> : panel === "variables" ? <div className="inspector-body"><div className="property-section"><div><strong>作品变量</strong><button onClick={() => setStatus("已创建未命名数值变量")}><Plus size={14} />新建</button></div><div className="variable-card"><span>信任 TRUST</span><strong>数值 · 0—10</strong><i style={{ width: "20%" }} /></div><div className="variable-card fear"><span>恐惧 FEAR</span><strong>数值 · 0—10</strong><i style={{ width: "35%" }} /></div><div className="variable-card affection"><span>好感 AFFECTION</span><strong>数值 · 0—10</strong><i style={{ width: "10%" }} /></div></div><p className="panel-tip"><Lock size={14} />发布时后端会重新验证所有变量、条件和节点引用。</p></div> : <div className="inspector-body"><label className="upload-drop"><CloudUpload size={28} /><strong>上传图片、音频或视频</strong><span>拖放到这里，或点击选择文件</span><small>图片 20MB · 音频 100MB · 视频 2GB</small><input type="file" multiple accept="image/*,audio/*,video/*" onChange={(event) => setStatus(event.target.files?.length ? `已选择 ${event.target.files.length} 个素材文件` : "未选择素材")} /></label><div className="media-types"><span><ImageIcon size={17} />图片</span><span><Music2 size={17} />音频</span><span><Video size={17} />视频</span></div><p className="panel-tip">当前已完成上传接口边界；配置 S3 兼容对象存储后启用直传与转码。</p></div>}</aside>
    </div>
  );
}
