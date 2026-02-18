import { z } from 'zod';

export const MemorySchema = z.object({
  id: z.string(),
  agentId: z.string(),
  content: z.string().min(1),
  importance: z.number().min(0).max(10),
  createdAt: z.string().datetime(),
});

export const MemoryCreateSchema = z.object({
  content: z.string().min(1, 'Memory content is required'),
  importance: z.number().min(0).max(10).default(5),
});

export const MemorySummarySchema = z.object({
  summary: z.string(),
  totalMemories: z.number().int(),
});

export const GetMemoriesResponseSchema = z.object({
  memories: z.array(MemorySchema),
});

export type Memory = z.infer<typeof MemorySchema>;
export type MemoryCreate = z.infer<typeof MemoryCreateSchema>;
export type MemorySummary = z.infer<typeof MemorySummarySchema>;
export type GetMemoriesResponse = z.infer<typeof GetMemoriesResponseSchema>;
