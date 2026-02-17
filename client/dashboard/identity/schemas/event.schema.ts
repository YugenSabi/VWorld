import { z } from 'zod';

export const EventSchema = z.object({
  id: z.number().int(),
  content: z.string(),
  created_at: z.string(),
});

export const EventCreateSchema = z.object({
  content: z.string().min(1, 'Event content is required'),
});

export const GetEventsResponseSchema = z.object({
  events: z.array(EventSchema),
  total: z.number().int(),
});

export type Event = z.infer<typeof EventSchema>;
export type EventCreate = z.infer<typeof EventCreateSchema>;
export type GetEventsResponse = z.infer<typeof GetEventsResponseSchema>;
