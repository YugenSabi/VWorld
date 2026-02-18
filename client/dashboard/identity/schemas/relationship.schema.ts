import { z } from 'zod';

export const RelationshipSchema = z.object({
  id: z.number().int(),
  agent_from_id: z.number().int(),
  agent_to_id: z.number().int(),
  sympathy: z.number().int(),
});

export const RelationshipCreateSchema = z.object({
  agent_from_id: z.number().int(),
  agent_to_id: z.number().int(),
  sympathy: z.number().int().min(-10).max(10),
});

export const RelationshipGraphNodeSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const RelationshipGraphEdgeSchema = z.object({
  from_id: z.number().int(),
  to_id: z.number().int(),
  sympathy: z.number().int(),
});

export const RelationshipGraphSchema = z.object({
  nodes: z.array(RelationshipGraphNodeSchema),
  edges: z.array(RelationshipGraphEdgeSchema),
});

export type Relationship = z.infer<typeof RelationshipSchema>;
export type RelationshipCreate = z.infer<typeof RelationshipCreateSchema>;
export type RelationshipGraphNode = z.infer<typeof RelationshipGraphNodeSchema>;
export type RelationshipGraphEdge = z.infer<typeof RelationshipGraphEdgeSchema>;
export type RelationshipGraph = z.infer<typeof RelationshipGraphSchema>;
