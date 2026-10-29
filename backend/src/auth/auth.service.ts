import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import { DatabaseService } from "../database/database.service.js";
import type { AuthenticatedUser } from "./auth.types.js";

const registerSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱").max(254),
  displayName: z.string().trim().min(2, "昵称至少 2 个字符").max(32),
  password: z.string().min(8, "密码至少 8 位").max(128),
  confirmPassword: z.string().min(1, "请再次输入密码"),
}).refine((value) => value.password === value.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱"),
  password: z.string().min(1, "请输入密码"),
  remember: z.boolean().optional().default(true),
});

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  email_verified_at: Date | null;
  role: "user" | "admin";
}

@Injectable()
export class AuthService {
  private readonly cookieName: string;
  private readonly sessionDays: number;
  private readonly adminEmails: Set<string>;

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {
    this.cookieName = config.get("SESSION_COOKIE_NAME", "storyloom_session");
    this.sessionDays = Number(config.get("SESSION_TTL_DAYS", "30"));
    this.adminEmails = new Set(
      config.get("ADMIN_EMAILS", "")
        .split(",")
        .map((email: string) => email.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  get sessionCookieName() {
    return this.cookieName;
  }

  async register(input: unknown) {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message);
    const email = parsed.data.email.toLowerCase();
    const existing = await this.database.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount) throw new ConflictException("该邮箱已注册");

    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
    const code = String(randomInt(100000, 1000000));
    const codeHash = this.hash(code);

    const user = await this.database.transaction(async (client) => {
      const created = await client.query<UserRow>(
        `INSERT INTO users (email, display_name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, display_name, password_hash, email_verified_at, role`,
        [email, parsed.data.displayName, passwordHash],
      );
      await client.query(
        `INSERT INTO email_verification_codes (user_id, code_hash, expires_at)
         VALUES ($1, $2, now() + interval '15 minutes')`,
        [created.rows[0].id, codeHash],
      );
      return created.rows[0];
    });

    console.info(`[dev-mail] ${email} 的邮箱验证码：${code}`);
    return {
      user: this.toUser(user),
      verificationRequired: true,
      ...(this.config.get("DEV_EXPOSE_VERIFICATION_CODE", "false") === "true"
        ? { devVerificationCode: code }
        : {}),
    };
  }

  async resendVerification(input: unknown) {
    const parsed = z.object({ email: z.string().trim().email("请输入有效邮箱") }).safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message);
    const email = parsed.data.email.toLowerCase();
    const result = await this.database.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) throw new BadRequestException("该邮箱尚未注册");
    if (user.email_verified_at) return { verificationRequired: false };

    const code = String(randomInt(100000, 1000000));
    await this.database.query(
      `INSERT INTO email_verification_codes (user_id, code_hash, expires_at)
       VALUES ($1, $2, now() + interval '15 minutes')`,
      [user.id, this.hash(code)],
    );
    console.info(`[dev-mail] ${email} 的邮箱验证码：${code}`);
    return {
      verificationRequired: true,
      ...(this.config.get("DEV_EXPOSE_VERIFICATION_CODE", "false") === "true"
        ? { devVerificationCode: code }
        : {}),
    };
  }

  async verifyEmail(input: unknown) {
    const parsed = z.object({
      email: z.string().trim().email(),
      code: z.string().regex(/^\d{6}$/, "请输入 6 位验证码"),
    }).safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message);

    const result = await this.database.query<UserRow & { code_id: string; code_hash: string }>(
      `SELECT u.*, c.id AS code_id, c.code_hash
       FROM users u
       JOIN email_verification_codes c ON c.user_id = u.id
       WHERE u.email = $1 AND c.consumed_at IS NULL AND c.expires_at > now()
       ORDER BY c.created_at DESC LIMIT 1`,
      [parsed.data.email.toLowerCase()],
    );
    const row = result.rows[0];
    if (!row || row.code_hash !== this.hash(parsed.data.code)) {
      throw new BadRequestException("验证码错误或已过期");
    }
    await this.database.transaction(async (client) => {
      await client.query("UPDATE email_verification_codes SET consumed_at = now() WHERE id = $1", [row.code_id]);
      await client.query("UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1", [row.id]);
    });
    return { verified: true };
  }

  async login(input: unknown) {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message);
    const result = await this.database.query<UserRow>("SELECT * FROM users WHERE email = $1", [parsed.data.email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await argon2.verify(user.password_hash, parsed.data.password))) {
      throw new UnauthorizedException("邮箱或密码不正确");
    }
    if (!user.email_verified_at) throw new UnauthorizedException("请先完成邮箱验证");

    const token = randomBytes(32).toString("base64url");
    await this.database.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
      [user.id, this.hash(token), parsed.data.remember ? this.sessionDays : 1],
    );
    return { user: this.toUser(user), token, maxAgeMs: (parsed.data.remember ? this.sessionDays : 1) * 86400000 };
  }

  async logout(token?: string) {
    if (token) await this.database.query("DELETE FROM sessions WHERE token_hash = $1", [this.hash(token)]);
  }

  async userFromToken(token?: string): Promise<AuthenticatedUser | null> {
    if (!token) return null;
    const result = await this.database.query<UserRow>(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [this.hash(token)],
    );
    if (!result.rows[0]) return null;
    void this.database.query("UPDATE sessions SET last_seen_at = now() WHERE token_hash = $1", [this.hash(token)]);
    return this.toUser(result.rows[0]);
  }

  private hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  private toUser(row: UserRow): AuthenticatedUser {
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      emailVerified: Boolean(row.email_verified_at),
      role: row.role === "admin" || this.adminEmails.has(row.email.toLowerCase()) ? "admin" : "user",
    };
  }
}
