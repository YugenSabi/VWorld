'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import worldMap from '@shared/images/Fontain.gif';
import { useTranslations } from 'next-intl';
import type { WeatherType } from '../../../../schemas';
import type { Agent } from '../../../../schemas';
import { PlayerComponent } from '../player';
import type { AgentOnMap } from '../player';
import { RainOverlay } from './rain';
import { SnowOverlay } from './snow';
import { useRealtimeAgents } from '@/hooks';
import { useAgents } from '@/hooks';
import { USE_MOCK_AGENTS } from '@/mocks';
import { getWebSocketClient, WS_ENDPOINTS } from '@/api/websocket';

type ViewportProps = {
  weather: WeatherType;
};

export const ViewportComponent = ({ weather }: ViewportProps) => {
  const t = useTranslations('game.viewport');
  const { agents: apiAgents } = useAgents();

  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
  const [bubbles, setBubbles] = useState<Record<number, string>>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const bubbleTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const pointToAgent = useRef<Record<string, number>>({});

  useEffect(() => {
    if (apiAgents && apiAgents.length > 0) {
      setAgents(apiAgents);
      const initPos: Record<number, { x: number; y: number }> = {};
      const map: Record<string, number> = {};
      for (const a of apiAgents) {
        initPos[a.id] = { x: (a as any).x ?? 50, y: (a as any).y ?? 50 };
        if ((a as any).point_id) {
          map[(a as any).point_id] = a.id;
        }
      }
      setPositions(initPos);
      pointToAgent.current = map;
    }
  }, [apiAgents]);

  useEffect(() => {
    if (USE_MOCK_AGENTS) return;
    const client = getWebSocketClient(WS_ENDPOINTS.points);
    client.connect();

    const unsub = client.on<{ points: { id: string; x: number; y: number }[] }>(
      'points_update' as any,
      (data) => {
        if (!data?.points) return;
        setPositions((prev) => {
          const next = { ...prev };
          for (const p of data.points) {
            const agentId = pointToAgent.current[p.id];
            if (agentId !== undefined) {
              next[agentId] = { x: p.x, y: p.y };
            }
          }
          return next;
        });
      }
    );

    return () => {
      unsub();
    };
  }, []);

  const showBubble = useCallback((agentId: number, text: string, durationMs = 6000) => {
    setBubbles((prev) => ({ ...prev, [agentId]: text }));
    if (bubbleTimers.current[agentId]) {
      clearTimeout(bubbleTimers.current[agentId]);
    }
    bubbleTimers.current[agentId] = setTimeout(() => {
      setBubbles((prev) => {
        const next = { ...prev };
        delete next[agentId];
        return next;
      });
    }, durationMs);
  }, []);

  const handleAgentsUpdate = useCallback((updatedAgents: Agent[]) => {
    setAgents(updatedAgents);
    const map: Record<string, number> = {};
    for (const a of updatedAgents) {
      if ((a as any).point_id) {
        map[(a as any).point_id] = a.id;
      }
    }
    pointToAgent.current = map;
    setPositions((prev) => {
      const next = { ...prev };
      for (const a of updatedAgents) {
        if (next[a.id] === undefined) {
          next[a.id] = { x: (a as any).x ?? 50, y: (a as any).y ?? 50 };
        }
      }
      return next;
    });
  }, []);

  const handleAgentCreated = useCallback((agent: Agent) => {
    setAgents((prev) => {
      if (prev.some((a) => a.id === agent.id)) return prev;
      return [...prev, agent];
    });
    setPositions((prev) => ({
      ...prev,
      [agent.id]: { x: (agent as any).x ?? 50, y: (agent as any).y ?? 50 },
    }));
    if ((agent as any).point_id) {
      pointToAgent.current[(agent as any).point_id] = agent.id;
    }
  }, []);

  const handleAgentDeleted = useCallback((agentId: number) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    setPositions((prev) => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  }, []);

  const handleAgentMoved = useCallback((agentId: number, x: number, y: number) => {
    setPositions((prev) => ({ ...prev, [agentId]: { x, y } }));
  }, []);

  const handleAgentMoodChanged = useCallback((agentId: number, mood: string) => {
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, mood } : a)));
  }, []);

  useRealtimeAgents({
    onAgentsUpdate: handleAgentsUpdate,
    onAgentCreated: handleAgentCreated,
    onAgentDeleted: handleAgentDeleted,
    onAgentMoved: handleAgentMoved,
    onAgentMoodChanged: handleAgentMoodChanged,
    onAgentThought: (agentId: number, thought: string) => {
      showBubble(agentId, thought, 7000);
    },
    onAgentDialogue: (data: {
      agentId1: number; name1: string;
      agentId2: number; name2: string;
      messages: { speaker: string; text: string }[];
    }) => {
      if (data.messages.length > 0) {
        showBubble(data.agentId1, data.messages[0].text, 6000);
      }
      if (data.messages.length > 1) {
        setTimeout(() => {
          showBubble(data.agentId2, data.messages[1].text, 6000);
        }, 2000);
      }
    },
    enabled: !USE_MOCK_AGENTS,
  });

  const agentsOnMap: AgentOnMap[] = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    x: positions[agent.id]?.x ?? 50,
    y: positions[agent.id]?.y ?? 50,
    mood: agent.mood,
    bubble: bubbles[agent.id] ?? null,
  }));

  const weatherLabel = (() => {
    switch (weather) {
      case 'rainy':
        return t('weatherValues.rainy');
      case 'cloudy':
        return t('weatherValues.cloudy');
      case 'snowy':
        return t('weatherValues.snowy');
      case 'foggy':
        return t('weatherValues.foggy');
      case 'stormy':
        return t('weatherValues.stormy');
      case 'sunny':
      default:
        return t('weatherValues.sunny');
    }
  })();

  return (
    <Box as='section' flexDirection='column'>
      <Box
        alignItems='center'
        justifyContent='space-between'
        gap={10}
        padding='8px 14px'
        background='linear-gradient(180deg, var(--ui-color-infoBg, #171b30) 0%, var(--ui-color-infoBgDark, #131728) 100%)'
        borderBottom='2px solid var(--ui-color-borderBrown, #2a1204)'
        boxShadow='inset 0 -2px 0 var(--ui-color-accentGreenDark, #3a7a1a)'
      >
        <Text
          as='div'
          color='$textGold'
          font='$pixel'
          fontSize='0.7rem'
          letterSpacing='2px'
          textShadow='1px 1px 0 var(--ui-color-borderBrown, #2a1204)'
        >
          {t('locationName')}
        </Text>

        <Box alignItems='center' gap={14}>
          <Text as='span' color='$accentGreenLight' font='$pixel' fontSize='0.7rem' letterSpacing='1px'>
            {t('region')}
          </Text>
          <Text as='span' color='$accentGreenLight' font='$pixel' fontSize='0.7rem' letterSpacing='1px'>
            {`${t('weatherPrefix')}: ${weatherLabel}`}
          </Text>
        </Box>
      </Box>

      <Box
        position='relative'
        width='$full'
        backgroundColor='$mapBg'
        overflow='hidden'
        aspectRatio='5.5 / 3'
        boxShadow='inset 0 0 40px rgba(0, 0, 0, 0.5)'
      >
        <Image
          src={worldMap}
          alt={t('mapAlt')}
          fill
          unoptimized
          draggable={false}
          style={{ objectFit: 'cover', imageRendering: 'pixelated' }}
        />

        {weather === 'rainy' && <RainOverlay />}
        {weather === 'snowy' && <SnowOverlay />}
        <PlayerComponent agents={agentsOnMap} />
      </Box>
    </Box>
  );
};
