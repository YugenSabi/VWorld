import { z } from 'zod';

export const RelationshipTypeSchema = z.enum([
  'Friend',
  'Enemy',
  'Family',
  'Acquaintance',
  'Stranger',
  'Lover',
]);

export const RelationshipSchema = z.object({
  id: z.string(),
  fromAgentId: z.string(),
  toAgentId: z.string(),
  type: RelationshipTypeSchema,
  strength: z.number().min(0).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const RelationshipCreateSchema = z.object({
  fromAgentId: z.string(),
  toAgentId: z.string(),
  type: RelationshipTypeSchema,
  strength: z.number().min(0).max(100).default(50),
});

export const GetRelationshipsResponseSchema = z.object({
  relationships: z.array(RelationshipSchema),
});

export type Relationship = z.infer<typeof RelationshipSchema>;
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type RelationshipCreate = z.infer<typeof RelationshipCreateSchema>;
export type GetRelationshipsResponse = z.infer<typeof GetRelationshipsResponseSchema>;
