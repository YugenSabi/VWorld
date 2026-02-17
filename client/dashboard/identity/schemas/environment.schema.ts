import { z } from 'zod';

export const WeatherTypeSchema = z.enum([
  'Sunny',
  'Rainy',
  'Cloudy',
  'Snowy',
  'Foggy',
  'Stormy',
]);

export const WeatherUpdateSchema = z.object({
  weather: WeatherTypeSchema,
  speed: z.number().min(0).max(10)
});

export const TimeSpeedUpdateSchema = z.object({
  weather: WeatherTypeSchema,
  speed: z.number().min(0).max(10),
});

export const EnvironmentResponseSchema = z.object({
  weather: WeatherTypeSchema,
  speed: z.number(),
});

export type WeatherType = z.infer<typeof WeatherTypeSchema>;
export type WeatherUpdate = z.infer<typeof WeatherUpdateSchema>;
export type TimeSpeedUpdate = z.infer<typeof TimeSpeedUpdateSchema>;
export type EnvironmentResponse = z.infer<typeof EnvironmentResponseSchema>;
