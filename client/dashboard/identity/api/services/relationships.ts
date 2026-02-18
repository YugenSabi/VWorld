import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import {
  RelationshipGraphSchema,
  RelationshipSchema,
  type RelationshipGraph,
  type RelationshipCreate,
  type Relationship,
} from '../../schemas';

export const relationshipsService = {
  getAllRelationships: async (): Promise<RelationshipGraph> => {
    const graph = await apiClient.get<unknown>(API_ENDPOINTS.relationships.list);
    return RelationshipGraphSchema.parse(graph);
  },

  getAgentRelationships: async (agentId: string): Promise<Relationship[]> => {
    const relationships = await apiClient.get<unknown[]>(API_ENDPOINTS.relationships.byAgent(agentId));
    return relationships.map((item) => RelationshipSchema.parse(item));
  },

  createRelationship: async (data: RelationshipCreate): Promise<Relationship> => {
    return apiClient.post<Relationship>(API_ENDPOINTS.relationships.create, data);
  },
};
