"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { API_URL } from "@/lib/api";

type Mode = "login" | "register" | "verify";

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const path = mode === "login" ? "login" : mode === "register" ? "register" : "verify-email";
      const body = mode === "login" ? { email, password, remember } : mode === "register" ? { email, displayName, password, confirmPassword } : { email, code };
      const response = await fetch(`${API_URL}/auth/${path}`, { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      const payload = await response.json() as { error?: { message?: string }; devVerificationCode?: string; user?: { role?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "请求失败，请稍后重试");
      if (mode === "register") {
        if (payload.devVerificationCode) setCode(payload.devVerificationCode);
        setMode("verify"); setMessage(payload.devVerificationCode ? `开发环境验证码已填入：${payload.devVerificationCode}` : "验证码已发送至邮箱");
      } else if (mode === "verify") {
        setMode("login"); setMessage("邮箱验证成功，现在可以登录");
      } else {
        window.location.assign(payload.user?.role === "admin" ? "/admin" : "/");
      }
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "请求失败"); }
    finally { setLoading(false); }
  }

  async function resendCode() {
    if (resendCooldown > 0 || loading) return;
    setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const payload = await response.json() as { error?: { message?: string }; devVerificationCode?: string };
      if (!response.ok) throw new Error(payload.error?.message ?? "验证码发送失败");
      if (payload.devVerificationCode) setCode(payload.devVerificationCode);
      setMessage(payload.devVerificationCode ? `新验证码已填入：${payload.devVerificationCode}` : "新验证码已发送，请查收邮件");
      setResendCooldown(60);
      const timer = window.setInterval(() => setResendCooldown((value) => {
        if (value <= 1) { window.clearInterval(timer); return 0; }
        return value - 1;
      }), 1000);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "验证码发送失败");
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-card">
      <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>登录</button><button className={mode === "register" || mode === "verify" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>注册</button></div>
      <div className="auth-heading"><span>{mode === "login" ? "WELCOME BACK" : mode === "register" ? "JOIN THE STORY" : "VERIFY EMAIL"}</span><h1>{mode === "login" ? "回到你的故事里" : mode === "register" ? "从一封邮件开始" : "确认这是你的邮箱"}</h1><p>{mode === "verify" ? `我们向 ${email} 发送了 6 位验证码。` : "一个账号同步 Web、App 与小程序上的作品和进度。"}</p></div>
      <form onSubmit={submit} className="auth-form">
        {mode === "register" ? <label><span>昵称</span><div><UserRound size={18} /><input required minLength={2} maxLength={32} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="大家会这样称呼你" /></div></label> : null}
        {mode !== "verify" ? <label><span>邮箱</span><div><Mail size={18} /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div></label> : null}
        {mode === "verify" ? <label><span>邮箱验证码</span><div><CheckCircle2 size={18} /><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="6 位验证码" /></div></label> : <>
          <label><span>密码</span><div><LockKeyhole size={18} /><input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "至少 8 位" : "输入密码"} /><button type="button" aria-label="显示或隐藏密码" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          {mode === "register" ? <label><span>确认密码</span><div><LockKeyhole size={18} /><input required minLength={8} type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再输入一次密码" /></div></label> : <label className="auth-check"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>保持登录 30 天</span></label>}
        </>}
        {error ? <p className="form-message error">{error}</p> : null}{message ? <p className="form-message success">{message}</p> : null}
        <button className="button primary auth-submit" disabled={loading}>{loading ? <LoaderCircle size={18} className="spin" /> : null}{mode === "login" ? "登录" : mode === "register" ? "创建账号" : "验证邮箱"}<ArrowRight size={17} /></button>
      </form>
      {mode === "verify" ? <button className="auth-resend" type="button" disabled={loading || resendCooldown > 0} onClick={resendCode}>{resendCooldown > 0 ? `${resendCooldown} 秒后可重新发送` : "没有收到？重新发送验证码"}</button> : null}
      <p className="auth-agreement">继续即表示你同意服务协议与隐私政策。密码使用 Argon2id 哈希，登录凭证保存在 HttpOnly Cookie 中。</p>
    </div>
  );
}
