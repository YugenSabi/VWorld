'use client';

import { useState, useEffect, useCallback } from 'react';
import { environmentService } from '../api';
import type { WeatherType } from '../schemas';

interface UseEnvironmentState {
  weather: WeatherType;
  timeSpeed: number;
  isLoading: boolean;
}

interface UseEnvironmentReturn extends UseEnvironmentState {
  setWeather: (weather: WeatherType) => Promise<void>;
  setTimeSpeed: (speed: number) => Promise<void>;
}

function normalizeWeather(value: string): WeatherType {
  const weather = value.toLowerCase();
  switch (weather) {
    case 'sunny':
    case 'rainy':
    case 'cloudy':
    case 'snowy':
    case 'foggy':
    case 'stormy':
      return weather;
    default:
      return 'sunny';
  }
}

export function useEnvironment(): UseEnvironmentReturn {
  const [state, setState] = useState<UseEnvironmentState>({
    weather: 'sunny',
    timeSpeed: 1,
    isLoading: true,
  });

  useEffect(() => {
    environmentService
      .getWeather()
      .then((res) => {
        setState({ weather: normalizeWeather(res.weather), timeSpeed: res.speed ?? 1, isLoading: false });
      })
      .catch((err) => {
        console.error('[useEnvironment] fetch failed:', err);
        setState((prev) => ({ ...prev, isLoading: false }));
      });
  }, []);

  const setWeather = useCallback(async (weather: WeatherType) => {
    setState((prev) => ({ ...prev, weather }));
    try {
      const res = await environmentService.updateWeather({ weather });
      setState((prev) => ({ ...prev, weather: normalizeWeather(res.weather) }));
    } catch (err) {
      console.error('[useEnvironment] update failed:', err);
      try {
        const res = await environmentService.getWeather();
        setState((prev) => ({ ...prev, weather: normalizeWeather(res.weather) }));
      } catch {
        setState((prev) => ({ ...prev, weather: 'sunny' }));
      }
    }
  }, []);

  const setTimeSpeed = useCallback(async (speed: number) => {
    setState((prev) => ({ ...prev, timeSpeed: speed }));
    try {
      const res = await environmentService.updateTimeSpeed({ speed });
      setState((prev) => ({ ...prev, timeSpeed: res.speed }));
    } catch (err) {
      console.error('[useEnvironment] speed update failed:', err);
    }
  }, []);

  return { ...state, setWeather, setTimeSpeed };
}
