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
    const response = await apiClient.get<any>(API_ENDPOINTS.environment.weather);
    return EnvironmentResponseSchema.parse(response);
  },

  updateWeather: async (data: WeatherUpdate): Promise<EnvironmentResponse> => {
    const response = await apiClient.patch<any>(API_ENDPOINTS.environment.weather, data);
    return EnvironmentResponseSchema.parse(response);
  },

  getTimeSpeed: async (): Promise<{ speed: number }> => {
    return apiClient.get<{ speed: number }>(API_ENDPOINTS.environment.speed);
  },

  updateTimeSpeed: async (data: TimeSpeedUpdate): Promise<{ speed: number }> => {
    return apiClient.patch<{ speed: number }>(API_ENDPOINTS.environment.speed, data);
  },

  addWorldEvent: async (event: string): Promise<any> => {
    return apiClient.post<any>(API_ENDPOINTS.environment.event, { event });
  },
};
