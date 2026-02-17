'use client';

import { useEffect, useState } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { Button } from '@ui/button';
import { agentsService } from '@/api';
import type { Agent, WeatherType } from '../../../../schemas';
import { useTranslations } from 'next-intl';

const buttons = ['ENEMIES'] as const;
const weatherOptions: WeatherType[] = ['sunny', 'rainy', 'snowy'];

type ToolbarProps = {
  weather: WeatherType;
  isLoading: boolean;
  onWeatherChange: (weather: WeatherType) => Promise<void>;
  onAgentCreated: () => void;
  onAgentDeleted: (agentId: number) => void;
};

function getWeatherLabel(t: ReturnType<typeof useTranslations>, weather: WeatherType): string {
  switch (weather) {
    case 'rainy':
      return t('weatherValues.rainy');
    case 'snowy':
      return t('weatherValues.snowy');
    case 'cloudy':
      return t('weatherValues.cloudy');
    case 'foggy':
      return t('weatherValues.foggy');
    case 'stormy':
      return t('weatherValues.stormy');
    case 'sunny':
    default:
      return t('weatherValues.sunny');
  }
}

export const ToolbarComponent = ({
  weather,
  isLoading,
  onWeatherChange,
  onAgentCreated,
  onAgentDeleted,
}: ToolbarProps) => {
  const tToolbar = useTranslations('game.toolbar');
  const tViewport = useTranslations('game.viewport');

  const [isWeatherMenuOpen, setIsWeatherMenuOpen] = useState(false);
  const [isEntityMenuOpen, setIsEntityMenuOpen] = useState(false);
  const [isUpdatingWeather, setIsUpdatingWeather] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<number | null>(null);
  const [newAgentName, setNewAgentName] = useState('');
  const [createAgentError, setCreateAgentError] = useState<string | null>(null);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [entityAgents, setEntityAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (!isEntityMenuOpen) {
      return;
    }

    const loadAgents = async () => {
      setIsLoadingAgents(true);
      setEntityError(null);
      try {
        const response = await agentsService.getAgents();
        setEntityAgents(response.agents);
      } catch (error) {
        setEntityError(error instanceof Error ? error.message : tToolbar('entitiesLoadError'));
      } finally {
        setIsLoadingAgents(false);
      }
    };

    loadAgents();
  }, [isEntityMenuOpen, tToolbar]);

  const handleSelectWeather = async (nextWeather: WeatherType) => {
    if (nextWeather === weather || isUpdatingWeather) {
      setIsWeatherMenuOpen(false);
      return;
    }

    setIsUpdatingWeather(true);
    try {
      await onWeatherChange(nextWeather);
    } finally {
      setIsUpdatingWeather(false);
      setIsWeatherMenuOpen(false);
    }
  };

  const handleCreateAgent = async () => {
    const name = newAgentName.trim();
    if (!name) {
      setCreateAgentError(tToolbar('createEmptyError'));
      return;
    }

    if (name.length > 100) {
      setCreateAgentError(tToolbar('createLengthError'));
      return;
    }

    setCreateAgentError(null);
    setEntityError(null);
    setIsCreatingAgent(true);

    try {
      const response = await agentsService.createAgent({
        name,
        mood: 'neutral',
        personality: '',
        current_plan: '',
      });

      setEntityAgents((prev) => [...prev, response.agent]);
      setNewAgentName('');
      onAgentCreated();
    } catch (error) {
      setCreateAgentError(error instanceof Error ? error.message : tToolbar('createUnknownError'));
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    setEntityError(null);
    setDeletingAgentId(agentId);
    try {
      await agentsService.deleteAgent(String(agentId));
      setEntityAgents((prev) => prev.filter((agent) => agent.id !== agentId));
      onAgentDeleted(agentId);
    } catch (error) {
      setEntityError(error instanceof Error ? error.message : tToolbar('deleteUnknownError'));
    } finally {
      setDeletingAgentId(null);
    }
  };

  return (
    <Box as='aside' width={180} flexDirection='column' gap={8}>
      <Box paddingBottom={6} borderBottom='2px solid #2a2a4a'>
        <Text
          as='div'
          color='$textMuted'
          font='$pixel'
          fontSize='0.7rem'
          letterSpacing='2px'
          textAlign='center'
        >
          {tToolbar('title')}
        </Text>
      </Box>

      <Box as='aside' flexDirection='column' gap={12}>
        <Box flexDirection='column' gap={6}>
          <Button
            fullWidth
            size='lg'
            variant='outline'
            radius='sm'
            font='$pixel'
            fontSize='0.8rem'
            textColor='$textGold'
            bg='$buttonBg'
            borderColor='$border'
            onClick={() => setIsWeatherMenuOpen((prev) => !prev)}
            disabled={isUpdatingWeather}
          >
            WEATHER
          </Button>

          {isWeatherMenuOpen && (
            <Box flexDirection='column' gap={6} padding={6} background='rgba(18, 25, 42, 0.9)' border='1px solid #2a1204'>
              {weatherOptions.map((option) => {
                const selected = option === weather;
                return (
                  <Button
                    key={option}
                    fullWidth
                    size='sm'
                    variant='outline'
                    radius='sm'
                    font='$pixel'
                    fontSize='0.7rem'
                    textColor={selected ? '$accentGreenLight' : '$textGold'}
                    bg='$buttonBg'
                    borderColor='$border'
                    disabled={selected || isUpdatingWeather}
                    onClick={() => handleSelectWeather(option)}
                  >
                    {getWeatherLabel(tViewport, option)}
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>

        <Box flexDirection='column' gap={6}>
          <Button
            fullWidth
            size='lg'
            variant='outline'
            radius='sm'
            font='$pixel'
            fontSize='0.8rem'
            textColor='$textGold'
            bg='$buttonBg'
            borderColor='$border'
            onClick={() => setIsEntityMenuOpen((prev) => !prev)}
          >
            ENTITIES
          </Button>

          {isEntityMenuOpen && (
            <Box flexDirection='column' gap={6} padding={6} background='rgba(18, 25, 42, 0.9)' border='1px solid #2a1204'>
              <input
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder={tToolbar('createPlaceholder')}
                maxLength={100}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: 34,
                  padding: '6px 8px',
                  border: '1px solid #5a3a18',
                  background: '#11192a',
                  color: '#f4d88d',
                  fontFamily: 'var(--ui-font-pixel, monospace)',
                  fontSize: '12px',
                }}
              />

              <Button
                fullWidth
                size='sm'
                variant='outline'
                radius='sm'
                font='$pixel'
                fontSize='0.7rem'
                textColor='$textGold'
                bg='$buttonBg'
                borderColor='$border'
                onClick={handleCreateAgent}
                disabled={isCreatingAgent}
              >
                {isCreatingAgent ? tToolbar('createSubmitting') : tToolbar('createButton')}
              </Button>

              {createAgentError && (
                <Text as='div' color='$error' font='$pixel' fontSize='0.58rem'>
                  {createAgentError}
                </Text>
              )}

              <Box borderTop='1px solid #2a2a4a' paddingTop={6} flexDirection='column' gap={6}>
                {isLoadingAgents && (
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                    {tToolbar('entitiesLoading')}
                  </Text>
                )}

                {!isLoadingAgents && entityAgents.length === 0 && (
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                    {tToolbar('entitiesEmpty')}
                  </Text>
                )}

                {!isLoadingAgents && entityAgents.map((agent) => (
                  <Box key={agent.id} alignItems='center' justifyContent='space-between' gap={6}>
                    <Text as='span' color='$textGold' font='$pixel' fontSize='0.62rem'>
                      {agent.name}
                    </Text>
                    <Button
                      size='sm'
                      variant='outline'
                      radius='sm'
                      font='$pixel'
                      fontSize='0.58rem'
                      textColor='$textGold'
                      bg='$buttonBg'
                      borderColor='$border'
                      onClick={() => handleDeleteAgent(agent.id)}
                      disabled={deletingAgentId === agent.id}
                    >
                      {deletingAgentId === agent.id ? tToolbar('deleteSubmitting') : tToolbar('deleteButton')}
                    </Button>
                  </Box>
                ))}
              </Box>

              {entityError && (
                <Text as='div' color='$error' font='$pixel' fontSize='0.58rem'>
                  {entityError}
                </Text>
              )}
            </Box>
          )}
        </Box>

        {buttons.map((label) => (
          <Button
            key={label}
            fullWidth
            size='lg'
            variant='outline'
            radius='sm'
            font='$pixel'
            fontSize='0.8rem'
            textColor='$textGold'
            bg='$buttonBg'
            borderColor='$border'
          >
            {label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};
