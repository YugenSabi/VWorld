'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { CharacterCardComponent } from './card';
import { useTranslations } from 'next-intl';
import { useAgents, useRealtimeAgents } from '@/hooks';
import { MOCK_AGENTS, USE_MOCK_AGENTS } from '@/mocks';
import type { Agent } from '@/schemas';

interface CharacterPanelProps {
  locationId?: string;
}

export const CharacterPanelComponent = ({ locationId }: CharacterPanelProps) => {
  const t = useTranslations('game.characters');

  const { agents: apiAgents, isLoading, error } = useAgents();

  const initialAgents = USE_MOCK_AGENTS ? MOCK_AGENTS : apiAgents;

  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  useEffect(() => {
    setAgents(initialAgents);
  }, [initialAgents]);

  const handleAgentsUpdate = useCallback((updatedAgents: Agent[]) => {
    setAgents(updatedAgents);
  }, []);

  const handleAgentCreated = useCallback((newAgent: Agent) => {
    setAgents((prev) => [...prev, newAgent]);
  }, []);

  const handleAgentDeleted = useCallback((agentId: number) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
  }, []);

  const handleAgentMoodChanged = useCallback((agentId: number, mood: string) => {
    setAgents((prev) =>
      prev.map((agent) => (agent.id === agentId ? { ...agent, mood } : agent))
    );
  }, []);

  useRealtimeAgents({
    onAgentsUpdate: handleAgentsUpdate,
    onAgentCreated: handleAgentCreated,
    onAgentDeleted: handleAgentDeleted,
    onAgentMoodChanged: handleAgentMoodChanged,
    enabled: !USE_MOCK_AGENTS,
  });

  return (
    <Box as='aside' width={210} flexDirection='column' gap={8}>
      <Box paddingBottom={6}  borderBottom='2px solid #2a2a4a'>
        <Text
          as='span'
          color='$textMuted'
          font='$pixel'
          fontSize='0.7rem'
          letterSpacing='2px'
          textAlign='center'
        >
          {t('title')}
        </Text>
      </Box>

      <Box flexDirection='column' gap={6}>
        {isLoading && (
          <Text as='div' color='$textMuted' font='$pixel' fontSize='0.6rem' textAlign='center'>
            Loading...
          </Text>
        )}

        {error && (
          <Text as='div' color='$error' font='$pixel' fontSize='0.6rem' textAlign='center'>
            Error: {error.message}
          </Text>
        )}

        {!isLoading &&
          !error &&
          agents.map((agent) => (
            <CharacterCardComponent
              key={agent.id}
              name={agent.name}
              mood={agent.mood}
            />
          ))}

        {!isLoading && !error && agents.length === 0 && (
          <Text as='div' color='$textMuted' font='$pixel' fontSize='0.6rem' textAlign='center'>
            No characters
          </Text>
        )}
      </Box>
    </Box>
  );
};
