import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import {
  AgentSchema,
  AgentPresetSchema,
  MobPresetSchema,
  GetAgentsResponseSchema,
  GetAgentByIdResponseSchema,
  type GetAgentsParams,
  type GetAgentsResponse,
  type GetAgentByIdResponse,
  type AgentCreate,
  type AgentUpdate,
  type GetAgentPresetsResponse,
  type MobPreset,
  type WeatherType,
} from '../../schemas';

export const agentsService = {
  getAgents: async (params?: GetAgentsParams): Promise<GetAgentsResponse> => {
    const response = await apiClient.get<any[]>(API_ENDPOINTS.agents.list, {
      params: params as Record<string, string | number | boolean | undefined>
    });

    return GetAgentsResponseSchema.parse({
      agents: response,
      total: response.length,
    });
  },

  getAgentById: async (id: string): Promise<GetAgentByIdResponse> => {
    const agent = await apiClient.get<any>(API_ENDPOINTS.agents.byId(id));
    return GetAgentByIdResponseSchema.parse({ agent });
  },

  getAgentPresets: async (weather: WeatherType): Promise<GetAgentPresetsResponse> => {
    const presets = await apiClient.get<any[]>(API_ENDPOINTS.agents.presets, {
      params: { weather },
    });
    return { presets: presets.map((preset) => AgentPresetSchema.parse(preset)) };
  },

  spawnFromPreset: async (presetId: string): Promise<GetAgentByIdResponse> => {
    const agent = await apiClient.post<any>(API_ENDPOINTS.agents.spawnPreset, {
      preset_id: presetId,
    });
    return GetAgentByIdResponseSchema.parse({ agent });
  },

  createAgent: async (data: AgentCreate): Promise<GetAgentByIdResponse> => {
    const agent = await apiClient.post<any>(API_ENDPOINTS.agents.create, data);
    return GetAgentByIdResponseSchema.parse({ agent });
  },

  updateAgent: async (id: string, data: AgentUpdate): Promise<GetAgentByIdResponse> => {
    const agent = await apiClient.patch<any>(API_ENDPOINTS.agents.update(id), data);
    return GetAgentByIdResponseSchema.parse({ agent });
  },

  deleteAgent: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.agents.delete(id));
  },

  getAgentProfile: async (id: string): Promise<any> => {
    const profile = await apiClient.get<any>(API_ENDPOINTS.agents.profile(id));
    return profile;
  },

  updateAgentMood: async (id: string, mood: string): Promise<any> => {
    const agent = await apiClient.patch<any>(API_ENDPOINTS.agents.mood(id), { mood });
    return AgentSchema.parse(agent);
  },

  getMobPresets: async (): Promise<MobPreset[]> => {
    const presets = await apiClient.get<any[]>(API_ENDPOINTS.agents.mobPresets);
    return presets.map((p) => MobPresetSchema.parse(p));
  },

  spawnMob: async (presetId: string): Promise<GetAgentByIdResponse> => {
    const agent = await apiClient.post<any>(API_ENDPOINTS.agents.spawnMob, {
      preset_id: presetId,
    });
    return GetAgentByIdResponseSchema.parse({ agent });
  },
};
