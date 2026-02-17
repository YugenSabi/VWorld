import { z } from 'zod';

export const AgentMoodSchema = z.string();

export const AgentSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1, 'Name is required'),
  mood: z.string(),
  personality: z.string().default(''),
  current_plan: z.string().default(''),
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

export type Agent = z.infer<typeof AgentSchema>;
export type AgentMood = z.infer<typeof AgentMoodSchema>;
export type AgentCreate = z.infer<typeof AgentCreateSchema>;
export type AgentUpdate = z.infer<typeof AgentUpdateSchema>;
export type GetAgentsParams = z.infer<typeof GetAgentsParamsSchema>;
export type GetAgentsResponse = z.infer<typeof GetAgentsResponseSchema>;
export type GetAgentByIdResponse = z.infer<typeof GetAgentByIdResponseSchema>;
