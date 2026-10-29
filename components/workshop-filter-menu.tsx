"use client";

import React from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

export type WorkshopSort = "recommended" | "latest" | "popular" | "rating";
export type WorkshopDuration = "all" | "short" | "medium" | "long";

type WorkshopFilterMenuProps = {
  query: string;
  currentTag: string;
  currentSort: WorkshopSort;
  currentDuration: WorkshopDuration;
  tags: string[];
};

const sortOptions: Array<{ value: WorkshopSort; label: string }> = [
  { value: "recommended", label: "综合推荐" },
  { value: "latest", label: "最新发布" },
  { value: "popular", label: "最受欢迎" },
  { value: "rating", label: "评分最高" },
];

const durationOptions: Array<{ value: WorkshopDuration; label: string }> = [
  { value: "all", label: "不限时长" },
  { value: "short", label: "10 分钟以内" },
  { value: "medium", label: "11–20 分钟" },
  { value: "long", label: "21 分钟以上" },
];

export function WorkshopFilterMenu({ query, currentTag, currentSort, currentDuration, tags }: WorkshopFilterMenuProps) {
  const [open, setOpen] = React.useState(false);
  const activeCount = Number(Boolean(currentTag)) + Number(currentSort !== "recommended") + Number(currentDuration !== "all");

  return (
    <div className="filter-menu">
      <button className="filter-button" type="button" aria-expanded={open} aria-controls="workshop-filter-panel" onClick={() => setOpen((value) => !value)}>
        <SlidersHorizontal size={17} />{activeCount ? `筛选 · ${activeCount}` : "筛选"}<ChevronDown size={15} className={open ? "filter-chevron-open" : ""} />
      </button>
      {open ? <form id="workshop-filter-panel" className="filter-menu-panel" action="/workshop" method="get">
        {query ? <input type="hidden" name="search" value={query} /> : null}
        <div className="filter-menu-heading"><div><span className="eyebrow">FILTERS</span><strong>筛选剧情</strong></div><button type="button" aria-label="关闭筛选" onClick={() => setOpen(false)}><X size={17} /></button></div>
        <fieldset><legend>题材</legend><div className="filter-option-grid"><label className={!currentTag ? "selected" : ""}><input type="radio" name="tag" value="" defaultChecked={!currentTag} />全部题材</label>{tags.map((tag) => <label className={currentTag === tag ? "selected" : ""} key={tag}><input type="radio" name="tag" value={tag} defaultChecked={currentTag === tag} />{tag}</label>)}</div></fieldset>
        <fieldset><legend>剧情时长</legend><div className="filter-option-list">{durationOptions.map((option) => <label className={currentDuration === option.value ? "selected" : ""} key={option.value}><input type="radio" name="duration" value={option.value} defaultChecked={currentDuration === option.value} />{option.label}</label>)}</div></fieldset>
        <fieldset><legend>排序方式</legend><select name="sort" defaultValue={currentSort}>{sortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></fieldset>
        <div className="filter-menu-actions"><a href={query ? `/workshop?search=${encodeURIComponent(query)}` : "/workshop"}>清除筛选</a><button className="button primary small" type="submit">应用筛选</button></div>
      </form> : null}
    </div>
  );
}
