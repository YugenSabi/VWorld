'use client';

import { useRef, useEffect } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export interface LogEntry {
  id: number;
  time: string;
  message: string;
  level?: 'info' | 'success' | 'warn' | 'error';
}

interface EventLogProps {
  logs: LogEntry[];
}

export const EventLogComponent = ({ logs }: EventLogProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs.length]);

  return (
    <Box
      flexDirection='column'
      gap={0}
      width='$full'
      minHeight={150}
      maxHeight={190}
      overflow='hidden'
      background='linear-gradient(180deg, #10182b 0%, #0a1020 100%)'
      border='2px solid #2e3f66'
      boxShadow='0 12px 26px rgba(0, 0, 0, 0.45)'
    >
      <Box
        padding='14px 16px'
        borderBottom='1px solid #2e3f66'
        alignItems='center'
        justifyContent='space-between'
        background='linear-gradient(180deg, rgba(28, 42, 71, 0.75) 0%, rgba(16, 24, 43, 0.65) 100%)'
      >
        <Text as='span' color='$textGold' font='$pixel' fontSize='0.7rem' letterSpacing='1px'>WORLD LOG</Text>
        <Text as='span' color='$textMuted' font='$pixel' fontSize='0.5rem'>{logs.length} events</Text>
      </Box>

      <div
        className='event-log-scroll'
        ref={scrollRef}
        style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px', gap: 10, overflow: 'auto', flexGrow: 1 }}
      >
        {logs.length === 0 && (
          <Text as='div' color='$textMuted' font='$pixel' fontSize='0.55rem'>
            awaiting events...
          </Text>
        )}

        {logs.map((log) => (
          <Box
            key={log.id}
            flexDirection='column'
            gap={4}
            padding='9px 10px'
            background='linear-gradient(180deg, rgba(20, 31, 52, 0.82) 0%, rgba(12, 19, 34, 0.82) 100%)'
            border='1px solid rgba(61, 84, 126, 0.75)'
            boxShadow='inset 0 0 0 1px rgba(13, 20, 36, 0.45)'
          >
            <Text as='span' color='$textMuted' font='$pixel' fontSize='0.45rem'>
              {log.time}
            </Text>
            <Text
              as='span'
              color={
                log.level === 'error'
                  ? '#ff6c6c'
                  : log.level === 'warn'
                    ? '#ffd166'
                    : log.level === 'success'
                      ? '$accentGreenBright'
                      : '$accentGreenLight'
              }
              font='$pixel'
              fontSize='0.55rem'
            >
              {log.message}
            </Text>
          </Box>
        ))}
      </div>
    </Box>
  );
};