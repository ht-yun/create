import { BadRequestException, Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { DatabaseService } from "../database/database.service.js";

export interface AccountAiRuntimeConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

interface AccountAiSettingsRow {
  base_url: string;
  model: string;
  api_key_ciphertext: string;
  key_hint: string;
  updated_at: Date;
}

const settingsSchema = z.object({
  baseUrl: z.string().trim().url("请输入有效的 API 地址").max(500),
  model: z.string().trim().min(1, "请输入模型名称").max(120),
  apiKey: z.string().trim().min(8, "API 密钥至少 8 个字符").max(1000).optional(),
});

@Injectable()
export class AccountAiSettingsService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async getPublic(userId: string) {
    const row = await this.row(userId);
    return row ? {
      configured: true,
      baseUrl: row.base_url,
      model: row.model,
      keyHint: row.key_hint,
      updatedAt: row.updated_at.toISOString(),
    } : {
      configured: false,
      baseUrl: "https://api.openai.com/v1/chat/completions",
      model: "",
      keyHint: "",
    };
  }

  async save(userId: string, input: unknown) {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message);
    const baseUrl = this.validateEndpoint(parsed.data.baseUrl);
    const existing = await this.row(userId);
    if (!parsed.data.apiKey && !existing) throw new BadRequestException("首次配置时请输入 API 密钥");
    const apiKeyCiphertext = parsed.data.apiKey ? this.encrypt(parsed.data.apiKey) : existing!.api_key_ciphertext;
    const keyHint = parsed.data.apiKey ? maskKey(parsed.data.apiKey) : existing!.key_hint;
    await this.database.query(
      `INSERT INTO user_ai_settings (user_id, base_url, model, api_key_ciphertext, key_hint)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id) DO UPDATE SET base_url=excluded.base_url, model=excluded.model,
       api_key_ciphertext=excluded.api_key_ciphertext, key_hint=excluded.key_hint, updated_at=now()`,
      [userId, baseUrl, parsed.data.model, apiKeyCiphertext, keyHint],
    );
    return this.getPublic(userId);
  }

  async remove(userId: string) {
    await this.database.query("DELETE FROM user_ai_settings WHERE user_id=$1", [userId]);
    return { removed: true };
  }

  async runtimeForUser(userId: string): Promise<AccountAiRuntimeConfig | undefined> {
    const row = await this.row(userId);
    if (!row) return undefined;
    return {
      apiKey: this.decrypt(row.api_key_ciphertext),
      baseUrl: row.base_url,
      model: row.model,
      timeoutMs: Math.max(10_000, Number(this.config.get("STORY_AI_TIMEOUT_MS", "90000"))),
    };
  }

  async test(userId: string) {
    const runtime = await this.runtimeForUser(userId);
    if (!runtime) throw new BadRequestException("请先保存 AI API 配置");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(runtime.timeoutMs, 20_000));
    try {
      const response = await fetch(runtime.baseUrl, {
        method: "POST",
        signal: controller.signal,
        headers: { authorization: `Bearer ${runtime.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model: runtime.model, max_tokens: 8, messages: [{ role: "user", content: "Reply with OK." }] }),
      });
      if (!response.ok) throw new ServiceUnavailableException(`连接失败：HTTP ${response.status} ${(await response.text()).slice(0, 180)}`);
      return { connected: true, model: runtime.model };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(`连接失败：${error instanceof Error ? error.message : "unknown"}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async row(userId: string) {
    const result = await this.database.query<AccountAiSettingsRow>("SELECT * FROM user_ai_settings WHERE user_id=$1", [userId]);
    return result.rows[0];
  }

  private validateEndpoint(value: string) {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) throw new BadRequestException("API 地址仅支持 HTTP 或 HTTPS");
    if (url.username || url.password) throw new BadRequestException("API 地址不能包含账号或密码");
    const host = url.hostname.toLowerCase();
    const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (this.config.get("NODE_ENV") === "production" && (url.protocol !== "https:" || local || isPrivateIpv4(host) || host.endsWith(".local"))) {
      throw new BadRequestException("生产环境只允许公网 HTTPS API 地址");
    }
    return url.toString();
  }

  private encryptionKey() {
    const configured = this.config.get<string>("API_CREDENTIAL_ENCRYPTION_KEY");
    if (!configured && this.config.get("NODE_ENV") === "production") {
      throw new ServiceUnavailableException("服务器尚未配置 API 凭据加密密钥");
    }
    const secret = configured || `${this.config.get("DATABASE_URL", "local")}:storyloom-local-credentials`;
    return createHash("sha256").update(secret).digest();
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
  }

  private decrypt(value: string) {
    const [version, iv, tag, encrypted] = value.split(".");
    if (version !== "v1" || !iv || !tag || !encrypted) throw new ServiceUnavailableException("保存的 API 凭据格式无效");
    try {
      const decipher = createDecipheriv("aes-256-gcm", this.encryptionKey(), Buffer.from(iv, "base64url"));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
    } catch {
      throw new ServiceUnavailableException("无法解密 API 凭据，请重新保存配置");
    }
  }
}

function maskKey(value: string) {
  return `${value.slice(0, Math.min(3, value.length))}••••${value.slice(-4)}`;
}

function isPrivateIpv4(host: string) {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
}
