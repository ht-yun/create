import Link from "next/link";
import { ArrowLeft, BookOpen, Cloud, PenLine, Route } from "lucide-react";
import { Brand } from "@/components/app-shell";
import { AuthPanel } from "@/components/auth-panel";

export const metadata = { title: "登录与注册" };

export default function AuthPage() {
  return (
    <main className="auth-page">
      <div className="auth-top"><Brand /><Link href="/"><ArrowLeft size={17} />返回首页</Link></div>
      <section className="auth-intro"><span className="eyebrow">ONE ACCOUNT · EVERY STORY</span><h2>把走过的分支，<br />留在同一个故事世界。</h2><p>收藏、进度、创作草稿与发布记录会跟随账号同步到未来的 App 和小程序。</p><div className="auth-benefits"><span><BookOpen size={19} /><b>继续体验</b><small>跨设备保留剧情进度</small></span><span><PenLine size={19} /><b>自由创作</b><small>保存节点、变量与素材</small></span><span><Route size={19} /><b>回看分支</b><small>随时返回走过的节点</small></span><span><Cloud size={19} /><b>多端同步</b><small>一个账号连接三端</small></span></div></section>
      <AuthPanel />
    </main>
  );
}
