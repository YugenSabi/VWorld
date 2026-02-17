import { z } from 'zod';

export const WeatherTypeSchema = z.enum([
  'sunny',
  'rainy',
  'cloudy',
  'snowy',
  'foggy',
  'stormy',
]);

export const WeatherUpdateSchema = z.object({
  weather: WeatherTypeSchema,
});

export const TimeSpeedUpdateSchema = z.object({
  speed: z.number().min(0.1).max(10),
});

export const EnvironmentResponseSchema = z.object({
  weather: WeatherTypeSchema,
  speed: z.number(),
});

export type WeatherType = z.infer<typeof WeatherTypeSchema>;
export type WeatherUpdate = z.infer<typeof WeatherUpdateSchema>;
export type TimeSpeedUpdate = z.infer<typeof TimeSpeedUpdateSchema>;
export type EnvironmentResponse = z.infer<typeof EnvironmentResponseSchema>;
