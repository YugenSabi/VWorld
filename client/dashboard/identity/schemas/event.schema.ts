import { z } from 'zod';

export const EventTypeSchema = z.enum([
  'AgentAction',
  'WorldEvent',
  'Interaction',
  'StateChange',
]);

export const EventSchema = z.object({
  id: z.string(),
  type: EventTypeSchema,
  description: z.string(),
  agentId: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const EventCreateSchema = z.object({
  type: EventTypeSchema,
  description: z.string().min(1, 'Event description is required'),
  agentId: z.string().optional(),
});

export const GetEventsResponseSchema = z.object({
  events: z.array(EventSchema),
  total: z.number().int(),
});

export type Event = z.infer<typeof EventSchema>;
export type EventType = z.infer<typeof EventTypeSchema>;
export type EventCreate = z.infer<typeof EventCreateSchema>;
export type GetEventsResponse = z.infer<typeof GetEventsResponseSchema>;
