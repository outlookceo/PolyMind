import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .pipe(z.string().url().nullable())
  .nullable()
  .optional();

export const providerKeyCreateSchema = z.object({
  provider: z.string().trim().min(1, "请选择 Provider。").max(80),
  keyName: z.string().trim().min(1, "请输入 Key 名称。").max(120),
  apiKey: z.string().trim().min(8, "API Key 至少需要 8 个字符。").max(4096),
  baseUrl: optionalUrl
});

export const providerKeyTestSchema = z
  .object({
    provider: z.string().trim().min(1).max(80),
    apiKey: z.string().trim().min(8).max(4096).optional(),
    baseUrl: optionalUrl,
    providerKeyId: z.string().trim().min(1).optional()
  })
  .refine((value) => value.apiKey || value.providerKeyId, {
    message: "请提供待测试的 API Key 或已保存的 Key。"
  });

export const agentCreateSchema = z.object({
  name: z.string().trim().min(1, "请输入 AI 名称。").max(80),
  avatarUrl: optionalText,
  provider: z.string().trim().min(1, "请选择 Provider。").max(80),
  model: z.string().trim().min(1, "请输入模型名称。").max(120),
  providerKeyId: optionalText,
  roleTitle: optionalText,
  backgroundInfo: optionalText,
  persona: optionalText,
  speakingStyle: optionalText,
  systemPrompt: optionalText,
  temperature: z.coerce.number().min(0).max(2).default(0.6),
  maxTokens: z.coerce.number().int().min(128).max(32000).default(1200),
  isDefault: z.coerce.boolean().default(false)
});

export const agentPatchSchema = agentCreateSchema.partial();

export const spaceCreateSchema = z.object({
  title: z.string().trim().min(1, "请输入讨论空间名称。").max(160),
  topic: z.string().trim().min(1, "请输入讨论主题。").max(500),
  goal: optionalText,
  mode: z.string().trim().min(1, "请选择讨论模式。").max(80),
  maxRounds: z.coerce.number().int().min(1).max(12).default(4),
  autoSummary: z.coerce.boolean().default(true),
  agentIds: z.array(z.string().trim().min(1)).max(12).default([])
});

export const spacePatchSchema = spaceCreateSchema
  .omit({ agentIds: true })
  .extend({
    status: z.string().trim().min(1).max(40).optional(),
    agentIds: z.array(z.string().trim().min(1)).max(12).optional()
  })
  .partial();

export const memberCreateSchema = z.object({
  agentId: z.string().trim().min(1),
  seatOrder: z.coerce.number().int().min(0).default(0),
  enabled: z.coerce.boolean().default(true)
});

export const memberPatchSchema = z.object({
  seatOrder: z.coerce.number().int().min(0).optional(),
  enabled: z.coerce.boolean().optional()
});

export const messageCreateSchema = z.object({
  senderType: z.enum(["USER", "AGENT", "SYSTEM", "SUMMARY"]).default("USER"),
  senderAgentId: optionalText,
  content: z.string().trim().min(1, "消息内容不能为空。").max(20000),
  roundIndex: z.coerce.number().int().min(0).default(0),
  metadataJson: z.unknown().optional()
});

export const askAgentSchema = z.object({
  agentId: z.string().trim().min(1, "请选择 AI 参与者。"),
  userMessage: z.string().trim().min(1, "请输入点名问题。").max(6000)
});

export const runRoundSchema = z.object({
  userMessage: z
    .string()
    .trim()
    .max(6000, "用户输入过长，请控制在 6000 字以内。")
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional()
});

export const summarySchema = z.object({
  summaryAgentId: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional()
});
