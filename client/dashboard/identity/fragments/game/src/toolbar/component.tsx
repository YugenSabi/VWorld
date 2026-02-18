'use client';

import { useEffect, useState } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { Button } from '@ui/button';
import { agentsService } from '@/api';
import type { Agent, AgentPreset, MobPreset, WeatherType } from '../../../../schemas';
import { useTranslations } from 'next-intl';

const weatherOptions: WeatherType[] = ['sunny', 'rainy', 'snowy'];
const speedOptions = [1, 2, 5];

type ToolbarProps = {
  weather: WeatherType;
  timeSpeed: number;
  isLoading: boolean;
  onWeatherChange: (weather: WeatherType) => Promise<void>;
  onTimeSpeedChange: (speed: number) => Promise<void>;
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
  timeSpeed,
  isLoading,
  onWeatherChange,
  onTimeSpeedChange,
  onAgentCreated,
  onAgentDeleted,
}: ToolbarProps) => {
  const tToolbar = useTranslations('game.toolbar');
  const tViewport = useTranslations('game.viewport');

  const [isWeatherMenuOpen, setIsWeatherMenuOpen] = useState(false);
  const [isEntityMenuOpen, setIsEntityMenuOpen] = useState(false);
  const [isMobMenuOpen, setIsMobMenuOpen] = useState(false);
  const [isUpdatingWeather, setIsUpdatingWeather] = useState(false);
  const [isSpawningPreset, setIsSpawningPreset] = useState(false);
  const [isSpawningMob, setIsSpawningMob] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [isLoadingMobs, setIsLoadingMobs] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<number | null>(null);
  const [spawningPresetId, setSpawningPresetId] = useState<string | null>(null);
  const [spawningMobId, setSpawningMobId] = useState<string | null>(null);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [mobError, setMobError] = useState<string | null>(null);
  const [newAgentName, setNewAgentName] = useState('');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [entityAgents, setEntityAgents] = useState<Agent[]>([]);
  const [agentPresets, setAgentPresets] = useState<AgentPreset[]>([]);
  const [mobPresets, setMobPresets] = useState<MobPreset[]>([]);

  useEffect(() => {
    if (!isEntityMenuOpen) {
      return;
    }

    const loadAgents = async () => {
      setIsLoadingAgents(true);
      setIsLoadingPresets(true);
      setEntityError(null);
      try {
        const [agentsResponse, presetsResponse] = await Promise.all([
          agentsService.getAgents(),
          agentsService.getAgentPresets(weather),
        ]);
        setEntityAgents(agentsResponse.agents);
        setAgentPresets(presetsResponse.presets);
      } catch (error) {
        setEntityError(error instanceof Error ? error.message : tToolbar('entitiesLoadError'));
      } finally {
        setIsLoadingAgents(false);
        setIsLoadingPresets(false);
      }
    };

    loadAgents();
  }, [isEntityMenuOpen, tToolbar, weather]);

  useEffect(() => {
    if (!isMobMenuOpen) {
      return;
    }

    const loadMobs = async () => {
      setIsLoadingMobs(true);
      setMobError(null);
      try {
        const presets = await agentsService.getMobPresets();
        setMobPresets(presets);
      } catch (error) {
        setMobError(error instanceof Error ? error.message : 'Failed to load mobs');
      } finally {
        setIsLoadingMobs(false);
      }
    };

    loadMobs();
  }, [isMobMenuOpen]);

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

  const handleSpawnPreset = async (presetId: string) => {
    setEntityError(null);
    setIsSpawningPreset(true);
    setSpawningPresetId(presetId);

    try {
      const response = await agentsService.spawnFromPreset(presetId);
      setEntityAgents((prev) => [...prev, response.agent]);
      onAgentCreated();
    } catch (error) {
      setEntityError(error instanceof Error ? error.message : tToolbar('presetSpawnError'));
    } finally {
      setIsSpawningPreset(false);
      setSpawningPresetId(null);
    }
  };

  const handleSpawnMob = async (presetId: string) => {
    setMobError(null);
    setIsSpawningMob(true);
    setSpawningMobId(presetId);

    try {
      const response = await agentsService.spawnMob(presetId);
      setEntityAgents((prev) => [...prev, response.agent]);
      onAgentCreated();
    } catch (error) {
      setMobError(error instanceof Error ? error.message : tToolbar('mobSpawnError'));
    } finally {
      setIsSpawningMob(false);
      setSpawningMobId(null);
    }
  };

  const handleCreateAgent = async () => {
    const name = newAgentName.trim();
    if (!name) return;
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
      setEntityError(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    setEntityError(null);
    setMobError(null);
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

  const agentEntities = entityAgents.filter((a) => (a.type || 'agent') === 'agent');
  const mobEntities = entityAgents.filter((a) => a.type === 'mob');

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
          <Box flexDirection='row' flexWrap='wrap' gap={4} justifyContent='center'>
            {speedOptions.map((speed) => {
              const selected = timeSpeed === speed;
              return (
                <Button
                  key={speed}
                  size='sm'
                  variant='outline'
                  radius='sm'
                  font='$pixel'
                  fontSize='0.9rem'
                  textColor={selected ? '$accentGreenLight' : '$textGold'}
                  bg='$buttonBg'
                  borderColor={selected ? '$accentGreenLight' : '$border'}
                  disabled={selected || isLoading}
                  onClick={() => onTimeSpeedChange(speed)}
                >
                  {speed}x
                </Button>
              );
            })}
          </Box>
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
              <Box borderBottom='1px solid #2a2a4a' paddingBottom={6} flexDirection='column' gap={6}>
                <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                  CREATE
                </Text>
                <input
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAgent(); }}
                  placeholder='agent name...'
                  maxLength={100}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    height: 28,
                    padding: '4px 8px',
                    border: '1px solid #5a3a18',
                    background: '#0d1220',
                    color: '#f4d88d',
                    fontFamily: 'var(--ui-font-pixel, monospace)',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                />
                <Button
                  fullWidth
                  size='sm'
                  variant='outline'
                  radius='sm'
                  font='$pixel'
                  fontSize='0.62rem'
                  textColor='$textGold'
                  bg='$buttonBg'
                  borderColor='$border'
                  onClick={handleCreateAgent}
                  disabled={isCreatingAgent || !newAgentName.trim()}
                >
                  {isCreatingAgent ? '...' : '+ CREATE'}
                </Button>
              </Box>

              <Box borderBottom='1px solid #2a2a4a' paddingBottom={6} flexDirection='column' gap={6}>
                <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                  {tToolbar('presetsTitle')}
                </Text>
                {isLoadingPresets && (
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                    {tToolbar('presetsLoading')}
                  </Text>
                )}

                {!isLoadingPresets && agentPresets.length === 0 && (
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                    {tToolbar('presetsEmpty')}
                  </Text>
                )}

                {!isLoadingPresets && agentPresets.map((preset) => (
                  <Box key={preset.id} alignItems='center' justifyContent='space-between' gap={6}>
                    <Text as='span' color='$textGold' font='$pixel' fontSize='0.62rem'>
                      {preset.name}
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
                      onClick={() => handleSpawnPreset(preset.id)}
                      disabled={isSpawningPreset && spawningPresetId === preset.id}
                    >
                      {isSpawningPreset && spawningPresetId === preset.id
                        ? tToolbar('presetSpawnSubmitting')
                        : tToolbar('presetSpawnButton')}
                    </Button>
                  </Box>
                ))}
              </Box>

              <Box borderTop='1px solid #2a2a4a' paddingTop={6} flexDirection='column' gap={6}>
                {isLoadingAgents && (
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                    {tToolbar('entitiesLoading')}
                  </Text>
                )}

                {!isLoadingAgents && agentEntities.length === 0 && (
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                    {tToolbar('entitiesEmpty')}
                  </Text>
                )}

                {!isLoadingAgents && agentEntities.map((agent) => (
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
            onClick={() => setIsMobMenuOpen((prev) => !prev)}
          >
            MOBS
          </Button>

          {isMobMenuOpen && (
            <Box flexDirection='column' gap={6} padding={6} background='rgba(18, 25, 42, 0.9)' border='1px solid #2a1204'>
              <Box borderBottom='1px solid #2a2a4a' paddingBottom={6} flexDirection='column' gap={6}>
                <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                  {tToolbar('mobsPresetsTitle')}
                </Text>
                {isLoadingMobs && (
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                    {tToolbar('mobsLoading')}
                  </Text>
                )}

                {!isLoadingMobs && mobPresets.length === 0 && (
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                    {tToolbar('mobsEmpty')}
                  </Text>
                )}

                {!isLoadingMobs && mobPresets.map((preset) => (
                  <Box key={preset.id} alignItems='center' justifyContent='space-between' gap={6}>
                    <Text as='span' color='$textGold' font='$pixel' fontSize='0.62rem'>
                      {preset.name}
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
                      onClick={() => handleSpawnMob(preset.id)}
                      disabled={isSpawningMob && spawningMobId === preset.id}
                    >
                      {isSpawningMob && spawningMobId === preset.id
                        ? tToolbar('mobSpawnSubmitting')
                        : tToolbar('mobSpawnButton')}
                    </Button>
                  </Box>
                ))}
              </Box>

              {mobEntities.length > 0 && (
                <Box borderTop='1px solid #2a2a4a' paddingTop={6} flexDirection='column' gap={6}>
                  {mobEntities.map((mob) => (
                    <Box key={mob.id} alignItems='center' justifyContent='space-between' gap={6}>
                      <Text as='span' color='$textGold' font='$pixel' fontSize='0.62rem'>
                        {mob.name}
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
                        onClick={() => handleDeleteAgent(mob.id)}
                        disabled={deletingAgentId === mob.id}
                      >
                        {deletingAgentId === mob.id ? tToolbar('deleteSubmitting') : tToolbar('deleteButton')}
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}

              {mobError && (
                <Text as='div' color='$error' font='$pixel' fontSize='0.58rem'>
                  {mobError}
                </Text>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
