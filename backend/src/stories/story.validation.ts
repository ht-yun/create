import { z } from "zod";

const change = z.object({
  key: z.string().min(1),
  operation: z.enum(["set", "add", "subtract"]),
  value: z.union([z.number(), z.boolean(), z.string()]),
});

const condition = z.object({
  variable: z.string().min(1),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte"]),
  value: z.union([z.number(), z.boolean(), z.string()]),
});

export const graphSchema = z.object({
  version: z.literal(1),
  startNodeId: z.string().min(1),
  variables: z.array(z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(["number", "boolean", "text"]),
    initialValue: z.union([z.number(), z.boolean(), z.string()]),
    min: z.number().optional(),
    max: z.number().optional(),
  })).max(100),
  nodes: z.array(z.object({
    id: z.string().min(1),
    type: z.enum(["scene", "choice", "condition", "ending"]),
    title: z.string().min(1).max(120),
    speaker: z.string().max(60).optional(),
    content: z.string().max(20000),
    media: z.array(z.object({
      kind: z.enum(["image", "audio", "video"]),
      url: z.string().max(2048),
      playbackUrl: z.string().max(2048).optional(),
      alt: z.string().max(200).optional(),
    })).optional(),
    choices: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1).max(240),
      targetNodeId: z.string().min(1),
      changes: z.array(change).optional(),
      conditions: z.array(condition).optional(),
    })).optional(),
    nextNodeId: z.string().optional(),
    endingKey: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
  })).min(1).max(5000),
}).superRefine((graph, context) => {
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (!ids.has(graph.startNodeId)) context.addIssue({ code: "custom", message: "起始节点不存在" });
  for (const node of graph.nodes) {
    const targets = [node.nextNodeId, ...(node.choices?.map((choice) => choice.targetNodeId) ?? [])].filter(Boolean) as string[];
    for (const target of targets) if (!ids.has(target)) context.addIssue({ code: "custom", message: `节点 ${node.title} 指向不存在的节点` });
  }
});

export const createStorySchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(1000).default(""),
  tags: z.array(z.string().trim().min(1).max(24)).max(10).default([]),
  visibility: z.enum(["private", "unlisted", "public"]).default("private"),
  graph: graphSchema,
});

export const updateStorySchema = createStorySchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});
