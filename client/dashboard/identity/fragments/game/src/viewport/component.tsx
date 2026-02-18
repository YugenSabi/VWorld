'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { Button } from '@ui/button';
import worldMap from '@shared/images/Fontain.gif';
import char1Idle from '@shared/characters/char_1/beadwork-cross-stitch-pixel-art-pattern-people-dance-d2d7111f4ce5dc01915ceb14d47243a8.png';
import char2Idle from '@shared/characters/char_2/char2.png';
import char3Idle from '@shared/characters/char_3/char3.png';
import mob1 from '@shared/mobs/mob_1/cat-minecraft-anime-manga-color-by-number-pixel-art-coloring-bead-husky-dog-f7401d42da5ac56d0bcfabdcae54f435.png';
import mob2 from '@shared/mobs/mob_2/pixel-art-drawing-pixelation-dog-dog-952116381da75340b19b023c73ef8bcd.png';
import mob3 from '@shared/mobs/mob_3/cat-kitten-pixel-art-cat-1aff464dfe4364a01019b92731bf5252.png';
import { useTranslations } from 'next-intl';
import type { WeatherType } from '../../../../schemas';
import type { Agent } from '../../../../schemas';
import { PlayerComponent } from '../player';
import type { AgentOnMap } from '../player';
import { RainOverlay } from './rain';
import { SnowOverlay } from './snow';
import { ZoneOverlay } from './zone-overlay';
import { useRealtimeAgents } from '@/hooks';
import { useAgents } from '@/hooks';
import { agentsService } from '@/api';

import { getWebSocketClient, WS_ENDPOINTS } from '@/api/websocket';

type ViewportProps = {
  weather: WeatherType;
};

type InspectorProfile = {
  agent: Agent;
  character: {
    personality: string;
    mood: string;
    current_plan: string;
  };
  memories: Array<{
    id: number;
    content: string;
    created_at: string;
  }>;
  relationships: Array<{
    id: number;
    agent_from_id: number;
    agent_to_id: number;
    sympathy: number;
  }>;
};

function resolveInspectorAvatar(name: string, type?: string): string {
  if ((type || 'agent') === 'mob') {
    const normalized = (name || '').toLowerCase().trim();
    if (normalized.includes('murka') || normalized.includes('cat')) {
      return (mob3 as { src: string }).src;
    }
    if (normalized.includes('buddy') || normalized.includes('dog')) {
      return (mob2 as { src: string }).src;
    }
    if (normalized.includes('chizh') || normalized.includes('bird')) {
      return (mob1 as { src: string }).src;
    }
    return (mob1 as { src: string }).src;
  }
  const normalized = (name || '').toLowerCase().trim();
  if (normalized.includes('mira')) {
    return (char1Idle as { src: string }).src;
  }
  if (normalized.includes('dorian')) {
    return (char2Idle as { src: string }).src;
  }
  if (normalized.includes('lyra')) {
    return (char3Idle as { src: string }).src;
  }
  return (char1Idle as { src: string }).src;
}

export const ViewportComponent = ({ weather }: ViewportProps) => {
  const t = useTranslations('game.viewport');
  const { agents: apiAgents } = useAgents();

  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
  const [bubbles, setBubbles] = useState<Record<number, string>>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [inspectedAgentId, setInspectedAgentId] = useState<number | null>(null);
  const [inspectedProfile, setInspectedProfile] = useState<InspectorProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [inspectorError, setInspectorError] = useState<string | null>(null);
  const [phraseHistory, setPhraseHistory] = useState<Record<number, string[]>>({});
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
    if (inspectedAgentId === agentId) {
      setInspectedAgentId(null);
      setInspectedProfile(null);
    }
  }, [inspectedAgentId]);

  const handleAgentMoved = useCallback((agentId: number, x: number, y: number) => {
    setPositions((prev) => ({ ...prev, [agentId]: { x, y } }));
  }, []);

  const handleAgentMoodChanged = useCallback((agentId: number, mood: string) => {
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, mood } : a)));
  }, []);

  const pushPhrase = useCallback((agentId: number, text: string) => {
    const normalized = (text || '').trim();
    if (!normalized) {
      return;
    }
    setPhraseHistory((prev) => {
      const existing = prev[agentId] || [];
      const next = [normalized, ...existing].slice(0, 8);
      return { ...prev, [agentId]: next };
    });
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
        pushPhrase(data.agentId1, data.messages[0].text);
      }
      if (data.messages.length > 1) {
        pushPhrase(data.agentId2, data.messages[1].text);
        setTimeout(() => {
          showBubble(data.agentId2, data.messages[1].text, 6000);
        }, 2000);
      }
    },
    enabled: true,
  });

  useEffect(() => {
    if (inspectedAgentId === null) {
      return;
    }

    let cancelled = false;
    setIsProfileLoading(true);
    setInspectorError(null);

    agentsService
      .getAgentProfile(String(inspectedAgentId))
      .then((profile) => {
        if (!cancelled) {
          setInspectedProfile(profile as InspectorProfile);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setInspectorError(error instanceof Error ? error.message : 'Failed to load profile');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsProfileLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [inspectedAgentId]);

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

  const inspectedAgent = inspectedAgentId ? agents.find((agent) => agent.id === inspectedAgentId) || null : null;
  const inspectedAvatar = inspectedAgent
    ? resolveInspectorAvatar(inspectedAgent.name, inspectedAgent.type)
    : '';
  const relationshipsWithNames = (inspectedProfile?.relationships || []).map((rel) => {
    const otherId =
      rel.agent_from_id === inspectedAgentId ? rel.agent_to_id : rel.agent_from_id;
    const other = agents.find((agent) => agent.id === otherId);
    return {
      ...rel,
      otherName: other?.name || `Agent #${otherId}`,
    };
  });
  const inspectorPhrases = inspectedAgentId ? phraseHistory[inspectedAgentId] || [] : [];

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

        <ZoneOverlay />
        {weather === 'rainy' && <RainOverlay />}
        {weather === 'snowy' && <SnowOverlay />}
        <PlayerComponent
          agents={agentsOnMap}
          inspectedAgentId={inspectedAgentId}
          onInspectAgent={(agentId) => setInspectedAgentId(agentId)}
        />

        {inspectedAgent && (
          <Box
            position='absolute'
            left={12}
            bottom={12}
            width={280}
            maxHeight='68%'
            overflow='auto'
            flexDirection='column'
            gap={8}
            padding={15}
            background='linear-gradient(180deg, rgba(16, 24, 43, 0.95) 0%, rgba(10, 16, 32, 0.95) 100%)'
            border='2px solid #2e3f66'
            boxShadow='0 12px 24px rgba(0, 0, 0, 0.5)'
            style={{ zIndex: 40 }}
          >
            <Box alignItems='center' justifyContent='space-between' borderBottom='1px solid #2e3f66' paddingBottom={6}>
              <Text as='span' color='$textGold' font='$pixel' fontSize='0.62rem' letterSpacing='1px'>
                AGENT INSPECTOR
              </Text>
              <Button
                size='sm'
                variant='outline'
                radius='sm'
                font='$pixel'
                fontSize='0.56rem'
                textColor='$textGold'
                bg='$buttonBg'
                borderColor='$border'
                onClick={() => {
                  setInspectedAgentId(null);
                  setInspectedProfile(null);
                  setInspectorError(null);
                }}
              >
                X
              </Button>
            </Box>

            <Box alignItems='center' gap={8}>
              <Box width={42} height={42} border='2px solid #ffffff' overflow='hidden'>
                <img
                  src={inspectedAvatar}
                  alt={inspectedAgent.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                />
              </Box>
              <Box flexDirection='column' gap={2} minWidth={0}>
                <Text as='span' color='$textGold' font='$pixel' fontSize='0.66rem'>
                  {inspectedAgent.name}
                </Text>
                <Text as='span' color='$textMuted' font='$pixel' fontSize='0.52rem'>
                  {(inspectedAgent.type || 'agent') === 'mob' ? 'Animal' : 'Character'}
                </Text>
              </Box>
            </Box>

            {isProfileLoading && (
              <Text as='div' color='$textMuted' font='$pixel' fontSize='0.55rem'>
                Loading profile...
              </Text>
            )}

            {inspectorError && (
              <Text as='div' color='$error' font='$pixel' fontSize='0.55rem'>
                {inspectorError}
              </Text>
            )}

            {inspectedProfile && (
              <Box flexDirection='column' gap={8}>
                <Box flexDirection='column' gap={4}>
                  <Text as='div' color='$textGold' font='$pixel' fontSize='0.56rem'>
                    Character
                  </Text>
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.53rem'>
                    {inspectedProfile.character.personality || 'No personality set'}
                  </Text>
                </Box>

                <Box flexDirection='column' gap={4}>
                  <Text as='div' color='$textGold' font='$pixel' fontSize='0.56rem'>
                    Relationships
                  </Text>
                  {relationshipsWithNames.length === 0 && (
                    <Text as='div' color='$textMuted' font='$pixel' fontSize='0.53rem'>
                      No relationship data
                    </Text>
                  )}
                  {relationshipsWithNames.map((rel) => (
                    <Box key={rel.id} justifyContent='space-between' alignItems='center'>
                      <Text as='span' color='$textMuted' font='$pixel' fontSize='0.52rem'>
                        {rel.otherName}
                      </Text>
                      <Text
                        as='span'
                        color={rel.sympathy > 1 ? '$accentGreenBright' : rel.sympathy < -1 ? '#ff6c6c' : '$textMuted'}
                        font='$pixel'
                        fontSize='0.52rem'
                      >
                        {rel.sympathy}
                      </Text>
                    </Box>
                  ))}
                </Box>

                <Box flexDirection='column' gap={4}>
                  <Text as='div' color='$textGold' font='$pixel' fontSize='0.56rem'>
                    Phrase history
                  </Text>
                  {inspectorPhrases.length === 0 && (
                    <Text as='div' color='$textMuted' font='$pixel' fontSize='0.53rem'>
                      No phrases yet
                    </Text>
                  )}
                  {inspectorPhrases.map((phrase, index) => (
                    <Text key={`${inspectedAgent.id}-phrase-${index}`} as='div' color='$textMuted' font='$pixel' fontSize='0.52rem'>
                      {phrase}
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

