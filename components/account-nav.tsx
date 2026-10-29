"use client";

import Link from "next/link";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type User = { displayName: string; email: string; role: "user" | "admin" };

export function AccountNav({ active }: { active?: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((response) => response.ok ? response.json() as Promise<{ user: User }> : null)
      .then((payload) => { if (!cancelled && payload?.user) setUser(payload.user); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  async function logout() {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => undefined);
    setUser(null);
  }

  if (!user) {
    return <Link href="/auth"><UserRound size={18} /><span>登录 / 注册</span></Link>;
  }

  return (
    <div className="account-nav">
      <div className="account-profile">
        <span className="account-avatar">{user.displayName.slice(0, 1)}</span>
        <span><strong>{user.displayName}</strong><small>{user.email}</small></span>
      </div>
      {user.role === "admin" ? <Link href="/admin" className={active === "admin" ? "active" : ""}><ShieldCheck size={18} /><span>管理后台</span></Link> : null}
      <Link href="/settings" className={active === "settings" ? "active" : ""}><UserRound size={18} /><span>账号设置</span></Link>
      <button type="button" onClick={logout}><LogOut size={18} /><span>退出登录</span></button>
    </div>
  );
}
