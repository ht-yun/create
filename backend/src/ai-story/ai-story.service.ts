import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { z } from "zod";
import type { AiStoryBrief, AiStoryMessage, AiStoryOutline, AiStoryPreferences, AiStoryQuestion, AiStorySession, AiStoryPhase } from "../../../shared/ai-story-contract.js";
import type { StoryGraph, StorySummary } from "../../../shared/story-contract.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { DatabaseService } from "../database/database.service.js";
import { StoriesService } from "../stories/stories.service.js";
import { AccountAiSettingsService } from "../account-settings/account-ai-settings.service.js";
import { graphSchema } from "../stories/story.validation.js";
import { GuidedTemplateStoryProvider, OpenAiCompatibleStoryProvider, type StoryAiProvider } from "./ai-story.provider.js";

interface SessionRow {
  id: string;
  user_id: string;
  story_id: string | null;
  phase: AiStoryPhase;
  provider: string;
  brief: AiStoryBrief;
  preferences: AiStoryPreferences;
  current_question: AiStoryQuestion | null;
  ready: boolean;
  outline: AiStoryOutline | null;
  draft_graph: StoryGraph | null;
  created_at: Date;
  updated_at: Date;
}

interface MessageRow { id: string; role: "user" | "assistant"; content: string; created_at: Date }

const startSchema = z.object({
  idea: z.string().trim().min(20, "请至少输入 20 个字的故事想法").max(5000),
  preferences: z.object({
    genre: z.string().trim().max(30).optional(),
    tone: z.string().trim().max(30).optional(),
    audience: z.string().trim().max(30).optional(),
    estimatedMinutes: z.number().int().min(5).max(60).default(15),
    endingCount: z.number().int().min(2).max(3).default(2),
    useVariables: z.boolean().default(true),
  }),
});
const answerSchema = z.object({ answer: z.string().trim().min(1).max(2000) });

@Injectable()
export class AiStoryService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(StoriesService) private readonly stories: StoriesService,
    @Inject(AccountAiSettingsService) private readonly accountSettings: AccountAiSettingsService,
    @Inject(OpenAiCompatibleStoryProvider) private readonly remoteProvider: OpenAiCompatibleStoryProvider,
    @Inject(GuidedTemplateStoryProvider) private readonly fallbackProvider: GuidedTemplateStoryProvider,
  ) {}

  async start(input: unknown, user: AuthenticatedUser) {
    const parsed = startSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message);
    const provider = await this.provider(user);
    const brief: AiStoryBrief = { idea: parsed.data.idea, tone: parsed.data.preferences.tone, answers: [] };
    const turn = await provider.interview(brief, parsed.data.preferences);
    const mergedBrief = { ...brief, ...(turn.briefPatch ?? {}), answers: brief.answers };
    const result = await this.database.query<SessionRow>(
      `INSERT INTO story_ai_sessions (user_id, phase, provider, brief, preferences, current_question, ready)
       VALUES ($1,'interview',$2,$3,$4,$5,$6) RETURNING *`,
      [user.id, provider.name, JSON.stringify(mergedBrief), JSON.stringify(parsed.data.preferences), JSON.stringify(turn.question ?? null), turn.ready],
    );
    const session = result.rows[0];
    await this.database.query(
      `INSERT INTO story_ai_messages (session_id, role, content) VALUES ($1,'user',$2),($1,'assistant',$3)`,
      [session.id, parsed.data.idea, turn.assistantMessage],
    );
    return this.get(session.id, user);
  }

  async answer(id: string, input: unknown, user: AuthenticatedUser) {
    const parsed = answerSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message);
    const session = await this.sessionRow(id, user);
    if (session.phase !== "interview" || session.ready || !session.current_question) throw new BadRequestException("当前会话不需要继续回答问题");
    const question = session.current_question;
    const brief = mergeAnswer(session.brief, question, parsed.data.answer);
    const provider = await this.providerFor(session.provider, user);
    let turn = await provider.interview(brief, session.preferences);
    if (brief.answers.length >= 5) turn = { ...turn, question: undefined, ready: true, assistantMessage: "五个关键问题已经回答完成。我整理好了故事设定卡，可以开始生成大纲。" };
    const mergedBrief = { ...brief, ...(turn.briefPatch ?? {}), answers: brief.answers };
    await this.database.transaction(async (client) => {
      await client.query(`UPDATE story_ai_sessions SET brief=$2,current_question=$3,ready=$4,updated_at=now() WHERE id=$1`, [id, JSON.stringify(mergedBrief), JSON.stringify(turn.question ?? null), turn.ready]);
      await client.query(`INSERT INTO story_ai_messages (session_id, role, content) VALUES ($1,'user',$2),($1,'assistant',$3)`, [id, parsed.data.answer, turn.assistantMessage]);
    });
    return this.get(id, user);
  }

  async generateOutline(id: string, user: AuthenticatedUser) {
    const session = await this.sessionRow(id, user);
    if (!session.ready) throw new BadRequestException("请先完成故事采访");
    const outline = await (await this.providerFor(session.provider, user)).outline(session.brief, session.preferences);
    validateOutline(outline, session.preferences.endingCount);
    await this.database.query(`UPDATE story_ai_sessions SET phase='outline',outline=$2,updated_at=now() WHERE id=$1`, [id, JSON.stringify(outline)]);
    await this.database.query(`INSERT INTO story_ai_messages (session_id, role, content) VALUES ($1,'assistant',$2)`, [id, `大纲《${outline.title}》已经生成。确认方向后，我会把它转换为可编辑的剧情节点。`]);
    return this.get(id, user);
  }

  async generateGraph(id: string, user: AuthenticatedUser) {
    const session = await this.sessionRow(id, user);
    if (!session.outline) throw new BadRequestException("请先生成故事大纲");
    const provider = await this.providerFor(session.provider, user);
    let graph = await provider.graph(session.brief, session.preferences, session.outline);
    let parsed = graphSchema.safeParse(graph);
    if (!parsed.success && provider.name !== this.fallbackProvider.name) {
      graph = await this.fallbackProvider.graph(session.brief, session.preferences, session.outline);
      parsed = graphSchema.safeParse(graph);
    }
    if (!parsed.success) throw new BadRequestException(`AI 节点图校验失败：${parsed.error.issues[0]?.message}`);
    validateGeneratedGraph(parsed.data, session.preferences.endingCount);
    await this.database.query(`UPDATE story_ai_sessions SET phase='generated',draft_graph=$2,updated_at=now() WHERE id=$1`, [id, JSON.stringify(parsed.data)]);
    await this.database.query(`INSERT INTO story_ai_messages (session_id, role, content) VALUES ($1,'assistant',$2)`, [id, `已生成 ${parsed.data.nodes.length} 个节点。确认后会创建一个私有草稿，原有作品不会被覆盖。`]);
    return this.get(id, user);
  }

  async apply(id: string, user: AuthenticatedUser) {
    const session = await this.sessionRow(id, user);
    if (session.story_id) return this.get(id, user);
    if (!session.outline || !session.draft_graph) throw new BadRequestException("请先生成并检查节点图");
    const story = await this.stories.create({ title: session.outline.title, summary: session.outline.summary, tags: session.outline.tags, visibility: "private", graph: session.draft_graph }, user);
    await this.database.query(`UPDATE story_ai_sessions SET phase='applied',story_id=$2,updated_at=now() WHERE id=$1`, [id, story.id]);
    return this.get(id, user);
  }

  async get(id: string, user: AuthenticatedUser): Promise<AiStorySession> {
    const row = await this.sessionRow(id, user);
    const messages = await this.database.query<MessageRow>(`SELECT id,role,content,created_at FROM story_ai_messages WHERE session_id=$1 ORDER BY created_at,id`, [id]);
    let story: StorySummary | undefined;
    if (row.story_id) story = await this.stories.getById(row.story_id, user);
    return {
      id: row.id, phase: row.phase, provider: row.provider, brief: row.brief, preferences: row.preferences,
      question: row.current_question ?? undefined, ready: row.ready, outline: row.outline ?? undefined, draftGraph: row.draft_graph ?? undefined,
      story, messages: messages.rows.map(toMessage), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
    };
  }

  private async provider(user: AuthenticatedUser) {
    const accountRuntime = await this.accountSettings.runtimeForUser(user.id);
    if (accountRuntime) return this.remoteProvider.forAccount(accountRuntime);
    return this.remoteProvider.isConfigured() ? this.remoteProvider : this.fallbackProvider;
  }
  private async providerFor(name: string, user: AuthenticatedUser): Promise<StoryAiProvider> {
    if (name === "account-api") {
      const accountRuntime = await this.accountSettings.runtimeForUser(user.id);
      return accountRuntime ? this.remoteProvider.forAccount(accountRuntime) : this.fallbackProvider;
    }
    return name === this.remoteProvider.name && this.remoteProvider.isConfigured() ? this.remoteProvider : this.fallbackProvider;
  }
  private async sessionRow(id: string, user: AuthenticatedUser) {
    const result = await this.database.query<SessionRow>(`SELECT * FROM story_ai_sessions WHERE id=$1 AND user_id=$2`, [id, user.id]);
    if (!result.rows[0]) throw new NotFoundException("AI 创作会话不存在");
    return result.rows[0];
  }
}

function mergeAnswer(brief: AiStoryBrief, question: AiStoryQuestion, answer: string): AiStoryBrief {
  const answers = [...brief.answers, { key: question.key, question: question.prompt, answer }];
  const next = { ...brief, answers };
  if (["protagonist", "goal", "conflict", "tone", "keyChoice", "endingDirection"].includes(question.key)) Object.assign(next, { [question.key]: answer });
  return next;
}

function toMessage(row: MessageRow): AiStoryMessage { return { id: row.id, role: row.role, content: row.content, createdAt: row.created_at.toISOString() }; }

function validateOutline(outline: AiStoryOutline, expectedEndings: number) {
  if (!outline?.title?.trim() || !outline.summary?.trim() || !Array.isArray(outline.acts) || outline.acts.length < 2) throw new BadRequestException("AI 返回的大纲不完整");
  if (!Array.isArray(outline.endings) || outline.endings.length !== expectedEndings) throw new BadRequestException(`大纲必须包含 ${expectedEndings} 个结局`);
}

function validateGeneratedGraph(graph: StoryGraph, expectedEndingCount: number) {
  if (graph.nodes.length < 8 || graph.nodes.length > 25) throw new BadRequestException("AI 节点数量必须在 8 到 25 之间");
  const endings = graph.nodes.filter((node) => node.type === "ending");
  if (endings.length !== expectedEndingCount) throw new BadRequestException(`节点图必须包含 ${expectedEndingCount} 个结局`);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const variables = new Map(graph.variables.map((variable) => [variable.key, variable]));
  const visited = new Set<string>();
  const queue = [graph.startNodeId];
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodes.get(id);
    if (!node) continue;
    for (const target of [node.nextNodeId, ...(node.choices?.map((choice) => choice.targetNodeId) ?? [])].filter(Boolean) as string[]) if (!visited.has(target)) queue.push(target);
  }
  const unreachable = graph.nodes.filter((node) => !visited.has(node.id));
  if (unreachable.length) throw new BadRequestException(`存在无法到达的节点：${unreachable.map((node) => node.title).join("、")}`);
  if (!graph.nodes.some((node) => node.type === "ending" && visited.has(node.id))) throw new BadRequestException("故事没有可到达的结局");

  const reverse = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const targets = [node.nextNodeId, ...(node.choices?.map((choice) => choice.targetNodeId) ?? [])].filter(Boolean) as string[];
    if (node.type !== "ending" && targets.length === 0) throw new BadRequestException(`普通节点“${node.title}”没有出口`);
    for (const target of targets) reverse.set(target, [...(reverse.get(target) ?? []), node.id]);
    for (const choice of node.choices ?? []) {
      for (const change of choice.changes ?? []) {
        const definition = variables.get(change.key);
        if (!definition) throw new BadRequestException(`选项引用了不存在的变量：${change.key}`);
        if (definition.type === "number" && typeof change.value !== "number") throw new BadRequestException(`变量 ${change.key} 的修改值类型不正确`);
      }
      for (const condition of choice.conditions ?? []) if (!variables.has(condition.variable)) throw new BadRequestException(`条件引用了不存在的变量：${condition.variable}`);
    }
  }
  const canReachEnding = new Set(endings.map((ending) => ending.id));
  const reverseQueue = [...canReachEnding];
  while (reverseQueue.length) {
    const id = reverseQueue.shift()!;
    for (const source of reverse.get(id) ?? []) if (!canReachEnding.has(source)) { canReachEnding.add(source); reverseQueue.push(source); }
  }
  const trapped = graph.nodes.filter((node) => visited.has(node.id) && !canReachEnding.has(node.id));
  if (trapped.length) throw new BadRequestException(`这些节点无法走到结局：${trapped.map((node) => node.title).join("、")}`);
}
