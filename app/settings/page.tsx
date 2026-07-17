"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, ChevronRight, Eye, Languages, LockKeyhole, MonitorCog, Palette, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const metadata = { title: "设置" };
const groups = [
  { title: "体验偏好", items: [{ icon: Palette, title: "阅读外观", description: "纸张色调、字号与文字间距", values: ["竹青", "宣纸", "夜读"] }, { icon: Bell, title: "声音与提醒", description: "背景音、环境音和新章节提醒", values: ["已开启", "仅环境音", "已关闭"] }, { icon: Languages, title: "语言", description: "界面与作品默认语言", values: ["简体中文", "繁体中文", "English"] }] },
  { title: "账号与隐私", items: [{ icon: LockKeyhole, title: "账号安全", description: "密码、邮箱验证与登录设备", values: ["管理"], href: "/auth" }, { icon: Eye, title: "体验记录", description: "控制作者可见的匿名游玩数据", values: ["仅匿名", "不共享", "允许共享"] }, { icon: ShieldCheck, title: "内容与屏蔽", description: "敏感内容提示、标签和屏蔽作者", values: ["标准", "严格", "宽松"] }] },
];
export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState("");
  function cycle(title: string, values: string[]) {
    const next = ((preferences[title] ?? 0) + 1) % values.length;
    setPreferences((current) => ({ ...current, [title]: next }));
    localStorage.setItem(`storyloom:${title}`, values[next]);
    setSaved(`${title}已设为“${values[next]}”`);
  }
  return <AppShell active="settings"><div className="page-wrap settings-page"><header className="workshop-header"><div><span className="eyebrow">PREFERENCES</span><h1>设置</h1><p>让阅读与创作环境更贴合你的习惯。</p></div><span className="updated-badge"><MonitorCog size={16} />当前设备</span></header>{saved ? <button className="settings-saved" onClick={() => setSaved("")}><Check size={15} />{saved}</button> : null}{groups.map((group) => <section className="settings-group" key={group.title}><h2>{group.title}</h2>{group.items.map((item) => { const Icon = item.icon; const content = <><span className="setting-icon"><Icon size={19} /></span><span><strong>{item.title}</strong><small>{item.description}</small></span><em>{item.values[preferences[item.title] ?? 0]}</em><ChevronRight size={17} /></>; return item.href ? <Link className="settings-row" href={item.href} key={item.title}>{content}</Link> : <button className="settings-row" onClick={() => cycle(item.title, item.values)} key={item.title}>{content}</button>; })}</section>)}<section className="settings-group about-block"><h2>关于折枝</h2><p>当前为 Web 与后端的首个开发版本。产品名称、版权信息与社区规则将在公开测试前确定。</p><span>Version 0.1.0 · Web alpha</span></section></div></AppShell>;
}
