import { z } from 'zod';

export const AgentMoodSchema = z.enum([
  'Friendly',
  'Angry',
  'Neutral',
  'Sad',
  'Happy',
  'Aggressive',
]);

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  mood: AgentMoodSchema,
  avatarUrl: z.string().url().optional().or(z.literal('')),
  level: z.number().int().min(1).max(100).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AgentCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  mood: AgentMoodSchema.default('Neutral'),
  avatarUrl: z.string().url().optional(),
  level: z.number().int().min(1).max(100).optional(),
});

export const AgentUpdateSchema = AgentCreateSchema.partial();

export const GetAgentsParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'name', 'level']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const GetAgentsResponseSchema = z.object({
  agents: z.array(AgentSchema),
  total: z.number().int(),
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
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
