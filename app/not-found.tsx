import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
export default function NotFound() { return <main className="not-found"><span>404 · LOST BRANCH</span><h1>这条故事分支还没有长出来</h1><p>作品可能尚未公开、已被作者收回，或链接已经失效。</p><div><Link className="button primary" href="/workshop"><Search size={16} />去创意工坊</Link><Link className="button ghost" href="/"><ArrowLeft size={16} />返回首页</Link></div></main>; }
