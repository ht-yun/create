"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, PlugZap, Save, ShieldCheck, Trash2 } from "lucide-react";
import { API_URL } from "@/lib/api";

interface PublicAiSettings {
  configured: boolean;
  baseUrl: string;
  model: string;
  keyHint: string;
  updatedAt?: string;
}

type Notice = { kind: "success" | "error"; text: string } | undefined;

export function AccountAiSettings() {
  const [settings, setSettings] = useState<PublicAiSettings>();
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1/chat/completions");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState<"save" | "test" | "delete">();
  const [unauthorized, setUnauthorized] = useState(false);
  const [notice, setNotice] = useState<Notice>();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/account/ai-settings`, { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) { setUnauthorized(true); return undefined; }
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || "读取配置失败");
        return body as PublicAiSettings;
      })
      .then((value) => {
        if (!value) return;
        setSettings(value);
        setBaseUrl(value.baseUrl);
        setModel(value.model);
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setNotice({ kind: "error", text: error.message });
      });
    return () => controller.abort();
  }, []);

  async function request(path: string, options: RequestInit) {
    const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers: { "content-type": "application/json", ...(options.headers ?? {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "请求失败");
    return body;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy("save");
    setNotice(undefined);
    try {
      const body = await request("/account/ai-settings", {
        method: "PUT",
        body: JSON.stringify({ baseUrl, model, ...(apiKey ? { apiKey } : {}) }),
      }) as PublicAiSettings;
      setSettings(body);
      setApiKey("");
      setShowKey(false);
      setNotice({ kind: "success", text: "AI API 配置已安全保存，并会用于之后的辅助创作。" });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "保存失败" });
    } finally { setBusy(undefined); }
  }

  async function testConnection() {
    setBusy("test");
    setNotice(undefined);
    try {
      const body = await request("/account/ai-settings/test", { method: "POST", body: "{}" }) as { model: string };
      setNotice({ kind: "success", text: `连接成功，模型 ${body.model} 可以正常响应。` });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "连接失败" });
    } finally { setBusy(undefined); }
  }

  async function remove() {
    if (!window.confirm("确定移除当前账号保存的 AI API 配置吗？")) return;
    setBusy("delete");
    setNotice(undefined);
    try {
      await request("/account/ai-settings", { method: "DELETE", body: "{}" });
      const empty = { configured: false, baseUrl: "https://api.openai.com/v1/chat/completions", model: "", keyHint: "" };
      setSettings(empty);
      setBaseUrl(empty.baseUrl);
      setModel("");
      setApiKey("");
      setNotice({ kind: "success", text: "账号 API 配置已移除。AI 创作将使用平台默认模式。" });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "移除失败" });
    } finally { setBusy(undefined); }
  }

  return (
    <section className="settings-group api-settings-card">
      <div className="api-settings-heading">
        <span className="setting-icon"><KeyRound size={19} /></span>
        <div><span className="section-label">AI PROVIDER</span><h2>AI API 配置</h2><p>连接 OpenAI 兼容接口，用于采访、生成大纲和创建剧情节点。</p></div>
        {settings?.configured ? <span className="api-configured"><CheckCircle2 size={14} />已配置</span> : <span className="api-unconfigured">未配置</span>}
      </div>

      {unauthorized ? <div className="api-login-required"><ShieldCheck size={22} /><div><strong>登录后配置</strong><p>API 密钥会绑定到你的账号，并由后端加密保存。</p></div><Link className="button primary" href="/auth?returnTo=%2Fsettings">登录</Link></div> : (
        <form className="api-settings-form" onSubmit={save}>
          <label><span>接口地址</span><input type="url" required value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://api.openai.com/v1/chat/completions" /><small>填写完整的 Chat Completions 接口地址。</small></label>
          <label><span>模型名称</span><input required value={model} onChange={(event) => setModel(event.target.value)} placeholder="例如：gpt-4.1-mini" /></label>
          <label><span>API 密钥</span><div className="api-key-input"><input type={showKey ? "text" : "password"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="new-password" placeholder={settings?.configured ? `已保存 ${settings.keyHint}，留空则不修改` : "请输入 API Key"} /><button type="button" onClick={() => setShowKey((value) => !value)} aria-label={showKey ? "隐藏 API 密钥" : "显示 API 密钥"}>{showKey ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><small>密钥只会发送到本站后端，页面不会读取或显示完整密钥。</small></label>
          {notice ? <div className={`api-settings-notice ${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16} /> : <PlugZap size={16} />}{notice.text}</div> : null}
          <div className="api-settings-actions">
            <button className="button primary" type="submit" disabled={Boolean(busy)}>{busy === "save" ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}保存配置</button>
            <button className="button pale" type="button" onClick={testConnection} disabled={Boolean(busy) || !settings?.configured}>{busy === "test" ? <LoaderCircle className="spin" size={16} /> : <PlugZap size={16} />}测试连接</button>
            {settings?.configured ? <button className="api-remove-button" type="button" onClick={remove} disabled={Boolean(busy)}>{busy === "delete" ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}移除配置</button> : null}
          </div>
        </form>
      )}
    </section>
  );
}
