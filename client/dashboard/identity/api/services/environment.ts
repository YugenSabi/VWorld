import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import {
  EnvironmentResponseSchema,
  type WeatherUpdate,
  type TimeSpeedUpdate,
  type EnvironmentResponse,
} from '../../schemas';

export const environmentService = {
  getWeather: async (): Promise<EnvironmentResponse> => {
    const response = await apiClient.get<unknown>(API_ENDPOINTS.environment.weather);
    return EnvironmentResponseSchema.parse(response);
  },

  updateWeather: async (data: WeatherUpdate): Promise<EnvironmentResponse> => {
    const response = await apiClient.patch<unknown>(API_ENDPOINTS.environment.weather, data);
    return EnvironmentResponseSchema.parse(response);
  },

  getTimeSpeed: async (): Promise<{ speed: number }> => {
    const response = await apiClient.get<unknown>(API_ENDPOINTS.environment.speed);
    const parsed = EnvironmentResponseSchema.parse(response);
    return { speed: parsed.speed };
  },

  updateTimeSpeed: async (data: TimeSpeedUpdate): Promise<{ speed: number }> => {
    const response = await apiClient.patch<unknown>(API_ENDPOINTS.environment.speed, data);
    const parsed = EnvironmentResponseSchema.parse(response);
    return { speed: parsed.speed };
  },

  addWorldEvent: async (event: string): Promise<unknown> => {
    return apiClient.post<unknown>(API_ENDPOINTS.environment.event, { content: event });
  },
};
