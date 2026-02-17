import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import {
  GetRelationshipsResponseSchema,
  type GetRelationshipsResponse,
  type RelationshipCreate,
  type Relationship,
} from '../../schemas';

export const relationshipsService = {
  getAllRelationships: async (): Promise<GetRelationshipsResponse> => {
    const relationships = await apiClient.get<any[]>(API_ENDPOINTS.relationships.list);
    return GetRelationshipsResponseSchema.parse({ relationships });
  },

  getAgentRelationships: async (agentId: string): Promise<GetRelationshipsResponse> => {
    const relationships = await apiClient.get<any[]>(API_ENDPOINTS.relationships.byAgent(agentId));
    return GetRelationshipsResponseSchema.parse({ relationships });
  },

  createRelationship: async (data: RelationshipCreate): Promise<Relationship> => {
    return apiClient.post<Relationship>(API_ENDPOINTS.relationships.create, data);
  },
};
