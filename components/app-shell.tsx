import Link from "next/link";
import { BookOpen, Home, Library, MessageCircle, MoreHorizontal, PenTool, Sparkles, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { AccountNav } from "./account-nav";

const navItems = [
  { key: "home", href: "/", label: "首页", icon: Home },
  { key: "workshop", href: "/workshop", label: "创意工坊", icon: Sparkles },
  { key: "community", href: "/community", label: "社区", icon: MessageCircle },
  { key: "rankings", href: "/rankings", label: "排行榜", icon: Trophy },
  { key: "studio", href: "/studio", label: "创作中心", icon: PenTool },
];

const mobileNavItems = [
  navItems[0],
  navItems[1],
  navItems[2],
  { key: "more", href: "/rankings", label: "更多", icon: MoreHorizontal },
];

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="折枝互动叙事首页">
      <span className="brand-mark"><span /></span>
      <span><strong>折枝</strong><small>互动叙事</small></span>
    </Link>
  );
}

export function AppShell({ active, children }: { active?: string; children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav className="primary-nav" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.key} href={item.href} className={active === item.key ? "active" : ""}>
                <Icon size={19} strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-warehouse">
          <div className="warehouse-icon"><Library size={18} /></div>
          <div><strong>我的仓库</strong><span>收藏与游玩记录</span></div>
          <Link href="/#warehouse" aria-label="打开我的仓库">查看</Link>
        </div>
        <div className="sidebar-spacer" />
        <nav className="secondary-nav" aria-label="账户导航">
          <AccountNav active={active} />
        </nav>
        <div className="sidebar-quote"><BookOpen size={16} /><p>每一次选择，<br />都让故事长出新的枝叶。</p></div>
      </aside>
      <div className="mobile-header"><Brand /><Link href="/studio" aria-label="创作中心"><PenTool size={20} /></Link></div>
      <main className="main-content">{children}</main>
      <nav className="mobile-nav" aria-label="移动端主导航">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return <Link key={item.key} href={item.href} className={active === item.key || (item.key === "more" && (active === "rankings" || active === "studio")) ? "active" : ""}><Icon size={19} /><span>{item.label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
