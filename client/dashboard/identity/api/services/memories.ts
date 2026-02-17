import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import {
  MemorySchema,
  MemorySummarySchema,
  GetMemoriesResponseSchema,
  type MemoryCreate,
  type GetMemoriesResponse,
  type MemorySummary,
  type Memory,
} from '../../schemas';

export const memoriesService = {
  addMemory: async (agentId: string, data: MemoryCreate): Promise<Memory> => {
    const memory = await apiClient.post<any>(API_ENDPOINTS.memory.add(agentId), data);
    return MemorySchema.parse(memory);
  },

  getMemories: async (agentId: string): Promise<GetMemoriesResponse> => {
    const memories = await apiClient.get<any[]>(API_ENDPOINTS.memory.list(agentId));
    return GetMemoriesResponseSchema.parse({ memories });
  },

  getMemorySummary: async (agentId: string): Promise<MemorySummary> => {
    const summary = await apiClient.get<any>(API_ENDPOINTS.memory.summary(agentId));
    return MemorySummarySchema.parse(summary);
  },
};
