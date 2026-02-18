'use client';

import { useCallback, useEffect, useState } from 'react';
import { eventsService } from '@/api';
import type { Event } from '@/schemas';
import { useEnvironment } from '../../../../hooks';
import { Box } from '@ui/layout';
import { HeaderComponent } from './header/component';
import { ViewportComponent } from '../viewport';
import { ToolbarComponent } from '../toolbar';
import { CharacterPanelComponent } from '../characters-list';
import { EventLogComponent, type LogEntry } from '../event-log';
import { DialoguePanelComponent } from '../dialogue-panel';
import { RelationshipsGraphComponent } from '../relationships-graph';
import { CommunicationsGraphComponent } from '../communications-graph';

export const HomeComponent = () => {
  const { weather, timeSpeed, isLoading, setWeather, setTimeSpeed } = useEnvironment();
  const [agentsRefreshSignal, setAgentsRefreshSignal] = useState(0);
  const [deletedAgentId, setDeletedAgentId] = useState<number | null>(null);
  const [eventsRefreshSignal, setEventsRefreshSignal] = useState(0);
  const [worldLogs, setWorldLogs] = useState<LogEntry[]>([]);

  const toLogEntry = useCallback((event: Event): LogEntry => {
    const time = new Date(event.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      id: event.id,
      time,
      message: event.content,
      level: 'info',
    };
  }, []);

  const loadWorldLogs = useCallback(async () => {
    try {
      const response = await eventsService.getEvents();
      const ordered = [...response.events].reverse();
      setWorldLogs(ordered.map(toLogEntry));
    } catch {
      // Keep previous logs when backend is temporarily unavailable.
    }
  }, [toLogEntry]);

  useEffect(() => {
    loadWorldLogs();
  }, [loadWorldLogs, eventsRefreshSignal]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadWorldLogs();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [loadWorldLogs]);

  const handleAgentCreated = () => {
    setAgentsRefreshSignal((prev) => prev + 1);
    setEventsRefreshSignal((prev) => prev + 1);
  };

  const handleAgentDeleted = (agentId: number) => {
    setDeletedAgentId(agentId);
    setAgentsRefreshSignal((prev) => prev + 1);
    setEventsRefreshSignal((prev) => prev + 1);
  };

  const handleWeatherChange = async (nextWeather: typeof weather) => {
    await setWeather(nextWeather);
    setEventsRefreshSignal((prev) => prev + 1);
  };

  return (
    <Box as='section' width='$full' minHeight='100dvh' alignItems='center' justifyContent='center' overflow='auto' padding='24px 0'>
      <Box alignItems='flex-start' gap={16}>
        <ToolbarComponent
          weather={weather}
          timeSpeed={timeSpeed}
          isLoading={isLoading}
          onWeatherChange={handleWeatherChange}
          onTimeSpeedChange={setTimeSpeed}
          onAgentCreated={handleAgentCreated}
          onAgentDeleted={handleAgentDeleted}
        />

        <Box flexDirection='column' gap={12}>
          <Box
            as='main'
            flexDirection='column'
            width='min(960px, 55vw)'
            border='4px solid'
            borderColor='$borderBrown'
            boxShadow='inset 0 0 0 2px var(--ui-color-borderBrownLight, #5a3a18), 0 0 60px rgba(90, 170, 42, 0.08), 0 0 120px rgba(0, 0, 0, 0.5)'
          >
            <HeaderComponent />
            <ViewportComponent weather={weather} />

            <Box
              as='footer'
              height={8}
              background='linear-gradient(90deg, var(--ui-color-statusGreenDark, #2d4a1a) 0%, var(--ui-color-statusGreen, #3a6820) 25%, var(--ui-color-statusGreenDark, #2d4a1a) 50%, var(--ui-color-statusGreen, #3a6820) 75%, var(--ui-color-statusGreenDark, #2d4a1a) 100%)'
              borderTop='2px solid var(--ui-color-statusBorder, #4a8a28)'
            />
          </Box>

          <Box width='min(960px, 55vw)'>
            <DialoguePanelComponent />
          </Box>
        </Box>

        <Box flexDirection='column' gap={12}>
          <CharacterPanelComponent refreshSignal={agentsRefreshSignal} deletedAgentId={deletedAgentId} />
          <RelationshipsGraphComponent />
          <CommunicationsGraphComponent />
          <EventLogComponent logs={worldLogs} />
        </Box>
      </Box>
    </Box>
  );
};
