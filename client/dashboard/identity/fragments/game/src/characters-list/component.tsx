'use client';

import { useState, useEffect } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { CharacterCardComponent } from './card';
import { useTranslations } from 'next-intl';
import { useAgents, useRealtimeAgents } from '@/hooks';
import { MOCK_AGENTS, USE_MOCK_AGENTS } from '@/mocks';
import type { Agent } from '@/schemas';

interface CharacterPanelProps {
  locationId?: string;
  refreshSignal?: number;
  deletedAgentId?: number | null;
}

export const CharacterPanelComponent = ({
  locationId,
  refreshSignal = 0,
  deletedAgentId = null,
}: CharacterPanelProps) => {
  const t = useTranslations('game.characters');
  const [activeTab, setActiveTab] = useState<'agents' | 'mobs'>('agents');

  const { agents: apiAgents, isLoading, error, refetch } = useAgents();
  const initialAgents = USE_MOCK_AGENTS ? MOCK_AGENTS : apiAgents;

  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  useEffect(() => {
    setAgents(initialAgents);
  }, [initialAgents]);

  useEffect(() => {
    if (!USE_MOCK_AGENTS && refreshSignal > 0) {
      refetch();
    }
  }, [refreshSignal, refetch]);

  useEffect(() => {
    if (deletedAgentId !== null) {
      setAgents((prev) => prev.filter((agent) => agent.id !== deletedAgentId));
    }
  }, [deletedAgentId]);

  const handleAgentsUpdate = (updatedAgents: Agent[]) => {
    setAgents(updatedAgents);
  };

  const handleAgentCreated = (newAgent: Agent) => {
    setAgents((prev) => {
      if (prev.some((agent) => agent.id === newAgent.id)) {
        return prev;
      }
      return [...prev, newAgent];
    });
  };

  const handleAgentDeleted = (agentId: number) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
  };

  const handleAgentMoodChanged = (agentId: number, mood: string) => {
    setAgents((prev) =>
      prev.map((agent) => (agent.id === agentId ? { ...agent, mood } : agent))
    );
  };

  useRealtimeAgents({
    onAgentsUpdate: handleAgentsUpdate,
    onAgentCreated: handleAgentCreated,
    onAgentDeleted: handleAgentDeleted,
    onAgentMoodChanged: handleAgentMoodChanged,
    enabled: !USE_MOCK_AGENTS,
  });

  const agentEntities = agents.filter((agent) => (agent.type || 'agent') === 'agent');
  const mobEntities = agents.filter((agent) => (agent.type || 'agent') === 'mob');
  const visibleEntities = activeTab === 'agents' ? agentEntities : mobEntities;

  return (
    <Box as='aside' width={210} flexDirection='column' gap={8}>
      <Box paddingBottom={6} borderBottom='2px solid #2a2a4a'>
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

      <Box alignItems='center' gap={6}>
        <Box
          onClick={() => setActiveTab('agents')}
          padding='4px 7px'
          border='1px solid #2a2a4a'
          background={activeTab === 'agents' ? 'rgba(42, 60, 102, 0.8)' : 'rgba(18, 25, 42, 0.8)'}
        >
          <Text as='span' color='$textGold' font='$pixel' fontSize='0.52rem'>
            Characters
          </Text>
        </Box>
        <Box
          onClick={() => setActiveTab('mobs')}
          padding='4px 7px'
          border='1px solid #2a2a4a'
          background={activeTab === 'mobs' ? 'rgba(42, 60, 102, 0.8)' : 'rgba(18, 25, 42, 0.8)'}
        >
          <Text as='span' color='$textGold' font='$pixel' fontSize='0.52rem'>
            Animals
          </Text>
        </Box>
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
          visibleEntities.map((agent) => (
            <CharacterCardComponent
              key={agent.id}
              name={agent.name}
              mood={agent.mood}
              type={agent.type}
            />
          ))}

        {!isLoading && !error && visibleEntities.length === 0 && (
          <Text as='div' color='$textMuted' font='$pixel' fontSize='0.6rem' textAlign='center'>
            {activeTab === 'agents' ? 'No characters' : 'No animals'}
          </Text>
        )}
      </Box>
    </Box>
  );
};
