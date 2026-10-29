"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Archive, Check, ChevronDown, Folder, FolderOpen, FolderPlus, Pencil, Plus, Tag, Trash2, WandSparkles, X } from "lucide-react";
import type { StorySummary } from "@/shared/story-contract";
import { StoryCard } from "@/components/story-card";

type SeriesFolder = {
  id: string;
  name: string;
  color: string;
  storyIds: string[];
};

const STORAGE_KEY = "storyloom:workshop-series-folders:v1";
const FOLDER_COLORS = ["#60785e", "#a8796f", "#9a896c", "#687c86", "#85709a"];

function loadFolders(): SeriesFolder[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((folder): folder is SeriesFolder => {
      if (!folder || typeof folder !== "object") return false;
      const value = folder as Partial<SeriesFolder>;
      return typeof value.id === "string" && typeof value.name === "string" && typeof value.color === "string" && Array.isArray(value.storyIds);
    });
  } catch {
    return [];
  }
}

export function WorkshopSeriesOrganizer({ stories, query, activeTag }: { stories: StorySummary[]; query: string; activeTag: string }) {
  const [folders, setFolders] = useState<SeriesFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [status, setStatus] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFolders(loadFolders());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  }, [folders, hydrated]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 2600);
    return () => window.clearTimeout(timer);
  }, [status]);

  const assignedStoryIds = useMemo(() => new Set(folders.flatMap((folder) => folder.storyIds)), [folders]);
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
  const visibleStories = selectedFolderId === "all"
    ? stories
    : selectedFolderId === "unfiled"
      ? stories.filter((story) => !assignedStoryIds.has(story.id))
      : stories.filter((story) => selectedFolder?.storyIds.includes(story.id));

  const folderStoryCount = (folder: SeriesFolder) => stories.filter((story) => folder.storyIds.includes(story.id)).length;
  const unfiledCount = stories.filter((story) => !assignedStoryIds.has(story.id)).length;
  const selectedLabel = selectedFolderId === "all" ? "全部作品" : selectedFolderId === "unfiled" ? "未整理" : selectedFolder?.name ?? "全部作品";

  function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    if (folders.some((folder) => folder.name === name)) {
      setStatus("已经有同名文件夹了");
      return;
    }
    const folder: SeriesFolder = {
      id: `series-${Date.now()}`,
      name,
      color: FOLDER_COLORS[folders.length % FOLDER_COLORS.length],
      storyIds: [],
    };
    setFolders((current) => [...current, folder]);
    setSelectedFolderId(folder.id);
    setNewFolderName("");
    setShowNewFolder(false);
    setStatus(`已创建「${name}」系列文件夹`);
  }

  function renameFolder(event: FormEvent<HTMLFormElement>, folderId: string) {
    event.preventDefault();
    const name = editingName.trim();
    if (!name) return;
    setFolders((current) => current.map((folder) => folder.id === folderId ? { ...folder, name } : folder));
    setEditingFolderId(null);
    setStatus("系列文件夹名称已更新");
  }

  function deleteFolder(folder: SeriesFolder) {
    if (!window.confirm(`删除「${folder.name}」文件夹？其中的作品会保留在“未整理”中。`)) return;
    setFolders((current) => current.filter((item) => item.id !== folder.id));
    if (selectedFolderId === folder.id) setSelectedFolderId("unfiled");
    setStatus(`已删除「${folder.name}」，作品没有被删除`);
  }

  function assignStory(storyId: string, folderId: string) {
    setFolders((current) => current.map((folder) => ({
      ...folder,
      storyIds: folder.id === folderId
        ? Array.from(new Set([...folder.storyIds, storyId]))
        : folder.storyIds.filter((id) => id !== storyId),
    })));
    const target = folders.find((folder) => folder.id === folderId);
    setStatus(folderId ? `已将作品归入「${target?.name ?? "系列"}」` : "已移出系列文件夹");
  }

  return (
    <>
      <section className="series-organizer series-organizer-compact" aria-labelledby="series-organizer-title">
        <div className="series-compact-bar">
          <div><span className="eyebrow">SERIES</span><strong id="series-organizer-title">同系列文件夹</strong><small>{selectedLabel} · {visibleStories.length} 部作品</small></div>
          <button className="series-compact-trigger" aria-expanded={organizerOpen} onClick={() => setOrganizerOpen((open) => !open)}><FolderOpen size={16} />{selectedLabel}<ChevronDown size={15} /></button>
        </div>
        {organizerOpen ? <div className="series-compact-panel">
          <div className="series-panel-heading"><span>选择系列</span><small><Archive size={13} />当前设备自动保存</small></div>
          <aside className="series-folder-list" aria-label="系列文件夹列表">
            <button className={`series-folder-item ${selectedFolderId === "all" ? "active" : ""}`} onClick={() => setSelectedFolderId("all")}><span className="series-folder-icon"><FolderOpen size={17} /></span><span><strong>全部作品</strong><small>{stories.length} 部作品</small></span></button>
            {folders.map((folder) => <div className={`series-folder-row ${selectedFolderId === folder.id ? "active" : ""}`} key={folder.id}>{editingFolderId === folder.id ? <form className="series-rename-form" onSubmit={(event) => renameFolder(event, folder.id)}><input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} aria-label="系列文件夹名称" /><button type="submit" aria-label="保存名称"><Check size={14} /></button><button type="button" onClick={() => setEditingFolderId(null)} aria-label="取消重命名"><X size={14} /></button></form> : <><button className="series-folder-item" onClick={() => setSelectedFolderId(folder.id)}><span className="series-folder-icon" style={{ backgroundColor: folder.color }}><Folder size={16} /></span><span><strong>{folder.name}</strong><small>{folderStoryCount(folder)} 部作品</small></span></button><div className="series-folder-actions"><button onClick={() => { setEditingFolderId(folder.id); setEditingName(folder.name); }} aria-label={`重命名${folder.name}`}><Pencil size={13} /></button><button onClick={() => deleteFolder(folder)} aria-label={`删除${folder.name}`}><Trash2 size={13} /></button></div></>}</div>)}
            <button className={`series-folder-item unfiled ${selectedFolderId === "unfiled" ? "active" : ""}`} onClick={() => setSelectedFolderId("unfiled")}><span className="series-folder-icon muted"><Tag size={16} /></span><span><strong>未整理</strong><small>{unfiledCount} 部作品</small></span></button>
          </aside>
          <div className="series-organizer-main">
            {showNewFolder ? <form className="series-create-form" onSubmit={createFolder}><FolderPlus size={17} /><input autoFocus value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="例如：晚风书屋系列" aria-label="新系列文件夹名称" /><button className="button primary small" type="submit">创建</button><button className="series-close-button" type="button" onClick={() => setShowNewFolder(false)} aria-label="取消创建"><X size={16} /></button></form> : <button className="series-add-button" onClick={() => setShowNewFolder(true)}><Plus size={16} />新建系列文件夹</button>}
            {status ? <div className="series-status" role="status"><Check size={14} />{status}</div> : null}
            <div className="series-selection-summary"><div><span>当前查看</span><strong>{selectedLabel}</strong></div><span className="result-count">{visibleStories.length} 部作品</span></div>
            <p className="series-tip"><WandSparkles size={14} />在作品卡片下方选择文件夹即可整理；一部作品只会归属于一个系列。</p>
          </div>
        </div> : null}
      </section>

      <section className="content-section flush">
        <div className="section-heading">
          <div><h2>{selectedFolderId === "all" ? (query ? `“${query}”的结果` : activeTag ? `${activeTag}作品` : "正在生长的故事") : selectedLabel}</h2><p>{selectedFolderId === "all" ? "综合完成率、收藏与近期口碑推荐。" : "同系列作品会集中显示在这里。"}</p></div>
          <span className="result-count">{visibleStories.length} 部作品</span>
        </div>
        <div className="story-grid workshop-grid">
          {visibleStories.map((story) => (
            <div className="series-story-card" key={story.id}>
              <StoryCard story={story} />
              <label className="series-card-assign">
                <Tag size={14} />
                <span>归入系列</span>
                <select value={folders.find((folder) => folder.storyIds.includes(story.id))?.id ?? ""} onChange={(event) => assignStory(story.id, event.target.value)} aria-label={`将《${story.title}》归入系列`}>
                  <option value="">未整理</option>
                  {folders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name}</option>)}
                </select>
              </label>
            </div>
          ))}
        </div>
        {!visibleStories.length ? <div className="empty-state"><WandSparkles size={30} /><h3>{selectedFolderId === "all" ? "还没有找到对应剧情" : "这个系列还没有作品"}</h3><p>{selectedFolderId === "all" ? "换一个关键词，或者成为第一个写下它的人。" : "在其他作品卡片下选择这个文件夹，就能把它加入系列。"}</p></div> : null}
      </section>
    </>
  );
}
