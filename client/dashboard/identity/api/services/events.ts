import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import {
  EventSchema,
  GetEventsResponseSchema,
  type GetEventsResponse,
  type EventCreate,
  type Event,
} from '../../schemas';

export const eventsService = {
  getEvents: async (): Promise<GetEventsResponse> => {
    const events = await apiClient.get<any[]>(API_ENDPOINTS.events.list);
    return GetEventsResponseSchema.parse({ events, total: events.length });
  },

  createEvent: async (data: EventCreate): Promise<Event> => {
    const event = await apiClient.post<any>(API_ENDPOINTS.events.create, data);
    return EventSchema.parse(event);
  },
};
