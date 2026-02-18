import { z } from 'zod';

export const AgentMoodSchema = z.string();

export const AgentSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1, 'Name is required'),
  type: z.string().default('agent'),
  mood: z.string(),
  personality: z.string().default(''),
  current_plan: z.string().default(''),
  x: z.number().default(50),
  y: z.number().default(50),
  created_at: z.string(),
});

export const AgentCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  mood: z.string().default('neutral'),
  personality: z.string().default(''),
  current_plan: z.string().default(''),
});

export const AgentUpdateSchema = AgentCreateSchema.partial();

export const GetAgentsParamsSchema = z.object({
  skip: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const GetAgentsResponseSchema = z.object({
  agents: z.array(AgentSchema),
  total: z.number().int(),
});

export const GetAgentByIdResponseSchema = z.object({
  agent: AgentSchema,
});

export const AgentPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  personality: z.string().default(''),
  mood: z.string().default('neutral'),
  current_plan: z.string().default(''),
  weather_tags: z.array(z.string()).default([]),
});

export const GetAgentPresetsResponseSchema = z.object({
  presets: z.array(AgentPresetSchema),
});

export type Agent = z.infer<typeof AgentSchema>;
export type AgentMood = z.infer<typeof AgentMoodSchema>;
export type AgentCreate = z.infer<typeof AgentCreateSchema>;
export type AgentUpdate = z.infer<typeof AgentUpdateSchema>;
export type GetAgentsParams = z.infer<typeof GetAgentsParamsSchema>;
export type GetAgentsResponse = z.infer<typeof GetAgentsResponseSchema>;
export type GetAgentByIdResponse = z.infer<typeof GetAgentByIdResponseSchema>;
export type AgentPreset = z.infer<typeof AgentPresetSchema>;
export type GetAgentPresetsResponse = z.infer<typeof GetAgentPresetsResponseSchema>;

export const MobPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  personality: z.string().default(''),
  mood: z.string().default('neutral'),
  current_plan: z.string().default(''),
});

export type MobPreset = z.infer<typeof MobPresetSchema>;
