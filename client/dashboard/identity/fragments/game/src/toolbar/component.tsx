'use client';

import { useEffect, useRef, useState } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { Button } from '@ui/button';
import { agentsService } from '@/api';
import type { Agent, AgentPreset, MobPreset, WeatherType } from '../../../../schemas';
import { useTranslations } from 'next-intl';
import char1Idle from '@shared/characters/char_1/beadwork-cross-stitch-pixel-art-pattern-people-dance-d2d7111f4ce5dc01915ceb14d47243a8.png';
import char2Idle from '@shared/characters/char_2/char2.png';
import char3Idle from '@shared/characters/char_3/char3.png';
import mob1 from '@shared/mobs/mob_1/cat-minecraft-anime-manga-color-by-number-pixel-art-coloring-bead-husky-dog-f7401d42da5ac56d0bcfabdcae54f435.png';
import mob2 from '@shared/mobs/mob_2/pixel-art-drawing-pixelation-dog-dog-952116381da75340b19b023c73ef8bcd.png';
import mob3 from '@shared/mobs/mob_3/cat-kitten-pixel-art-cat-1aff464dfe4364a01019b92731bf5252.png';

const weatherOptions: WeatherType[] = ['sunny', 'rainy', 'snowy'];
const speedOptions = [1, 2, 5];

type ToolbarPanel = 'weather' | 'entities' | 'mobs' | null;
type PanelKey = Exclude<ToolbarPanel, null>;

const panelLayout: Record<PanelKey, { width: number; minHeight: number; maxHeight: string }> = {
  weather: { width: 252, minHeight: 0, maxHeight: '320px' },
  entities: { width: 332, minHeight: 320, maxHeight: 'min(78vh, 560px)' },
  mobs: { width: 304, minHeight: 0, maxHeight: '420px' },
};

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

function getMobPresetAvatar(preset: MobPreset): string {
  const key = `${preset.id} ${preset.name}`.toLowerCase();
  if (key.includes('murka') || key.includes('cat')) {
    return (mob3 as { src: string }).src;
  }
  if (key.includes('buddy') || key.includes('dog')) {
    return (mob2 as { src: string }).src;
  }
  if (key.includes('chizh') || key.includes('bird')) {
    return (mob1 as { src: string }).src;
  }
  return (mob1 as { src: string }).src;
}

function getAgentPresetAvatar(preset: AgentPreset): string {
  const key = (preset.id || '').toLowerCase();
  if (key.includes('mira')) {
    return (char1Idle as { src: string }).src;
  }
  if (key.includes('dorian')) {
    return (char2Idle as { src: string }).src;
  }
  if (key.includes('lyra')) {
    return (char3Idle as { src: string }).src;
  }
  return (char1Idle as { src: string }).src;
}

function getAgentEntityAvatar(agent: Agent): string {
  const key = `${agent.name}`.toLowerCase();
  if (key.includes('mira')) {
    return (char1Idle as { src: string }).src;
  }
  if (key.includes('dorian')) {
    return (char2Idle as { src: string }).src;
  }
  if (key.includes('lyra')) {
    return (char3Idle as { src: string }).src;
  }
  return (char1Idle as { src: string }).src;
}

function getMobEntityAvatar(agent: Agent): string {
  const key = `${agent.name}`.toLowerCase();
  if (key.includes('murka') || key.includes('cat')) {
    return (mob3 as { src: string }).src;
  }
  if (key.includes('buddy') || key.includes('dog')) {
    return (mob2 as { src: string }).src;
  }
  if (key.includes('chizh') || key.includes('bird')) {
    return (mob1 as { src: string }).src;
  }
  return (mob1 as { src: string }).src;
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

  const [activePanel, setActivePanel] = useState<ToolbarPanel>(null);
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number } | null>(null);
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

  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<{
    weather: HTMLButtonElement | null;
    entities: HTMLButtonElement | null;
    mobs: HTMLButtonElement | null;
  }>({ weather: null, entities: null, mobs: null });

  const isWeatherMenuOpen = activePanel === 'weather';
  const isEntityMenuOpen = activePanel === 'entities';
  const isMobMenuOpen = activePanel === 'mobs';

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

  useEffect(() => {
    if (!activePanel) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) {
        return;
      }
      if (Object.values(buttonRefs.current).some((button) => button?.contains(target))) {
        return;
      }
      setActivePanel(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePanel(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [activePanel]);

  const openPanel = (panel: PanelKey, target: HTMLElement) => {
    if (activePanel === panel) {
      setActivePanel(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const panelWidth = panelLayout[panel].width;
    const margin = 12;
    const left = Math.max(
      margin,
      Math.min(window.innerWidth - panelWidth - margin, rect.left + rect.width / 2 - panelWidth / 2),
    );
    const top = Math.max(margin, Math.min(window.innerHeight - margin, rect.top + rect.height + 8));

    setPanelPosition({ top, left });
    setActivePanel(panel);
  };

  const handleSelectWeather = async (nextWeather: WeatherType) => {
    if (nextWeather === weather || isUpdatingWeather) {
      setActivePanel(null);
      return;
    }

    setIsUpdatingWeather(true);
    try {
      await onWeatherChange(nextWeather);
    } finally {
      setIsUpdatingWeather(false);
      setActivePanel(null);
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
  const currentPanelLayout = activePanel ? panelLayout[activePanel] : panelLayout.entities;

  return (
    <>
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
              ref={(node) => {
                buttonRefs.current.weather = node as HTMLButtonElement | null;
              }}
              fullWidth
              size='lg'
              variant='outline'
              radius='sm'
              font='$pixel'
              fontSize='0.8rem'
              textColor='$textGold'
              bg='$buttonBg'
              borderColor='$border'
              onClick={(event) => openPanel('weather', event.currentTarget as HTMLElement)}
              disabled={isUpdatingWeather}
            >
              WEATHER
            </Button>
          </Box>

          <Box flexDirection='column' gap={6}>
            <Button
              ref={(node) => {
                buttonRefs.current.entities = node as HTMLButtonElement | null;
              }}
              fullWidth
              size='lg'
              variant='outline'
              radius='sm'
              font='$pixel'
              fontSize='0.8rem'
              textColor='$textGold'
              bg='$buttonBg'
              borderColor='$border'
              onClick={(event) => openPanel('entities', event.currentTarget as HTMLElement)}
            >
              ENTITIES
            </Button>
          </Box>

          <Box flexDirection='column' gap={6}>
            <Button
              ref={(node) => {
                buttonRefs.current.mobs = node as HTMLButtonElement | null;
              }}
              fullWidth
              size='lg'
              variant='outline'
              radius='sm'
              font='$pixel'
              fontSize='0.8rem'
              textColor='$textGold'
              bg='$buttonBg'
              borderColor='$border'
              onClick={(event) => openPanel('mobs', event.currentTarget as HTMLElement)}
            >
              MOBS
            </Button>
          </Box>
        </Box>
      </Box>

      {activePanel && panelPosition && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: panelPosition.top,
            left: panelPosition.left,
            width: currentPanelLayout.width,
            minHeight: currentPanelLayout.minHeight || undefined,
            maxHeight: currentPanelLayout.maxHeight,
            overflowY: 'auto',
            zIndex: 80,
            border: '2px solid #2e3f66',
            boxShadow: '0 12px 26px rgba(0, 0, 0, 0.45)',
            background: '#131728',
            padding: 10,
          }}
        >
          <Box flexDirection='column' gap={8}>
            <Box alignItems='center' justifyContent='space-between' borderBottom='1px solid #2a2a4a' paddingBottom={6}>
              <Text as='div' color='$textGold' font='$pixel' fontSize='0.62rem' letterSpacing='1px'>
                {activePanel === 'weather' ? 'WEATHER' : activePanel === 'entities' ? 'ENTITIES' : 'MOBS'}
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
                onClick={() => setActivePanel(null)}
              >
                X
              </Button>
            </Box>

            {activePanel === 'weather' && (
              <Box flexDirection='column' gap={6}>
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

            {activePanel === 'entities' && (
              <Box flexDirection='column' gap={6}>
                <Box borderBottom='1px solid #2a2a4a' paddingBottom={6} flexDirection='column' gap={6}>
                  <Text as='div' color='$textMuted' font='$pixel' fontSize='0.58rem'>
                    CREATE
                  </Text>
                  <input
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateAgent();
                    }}
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

                  {!isLoadingPresets &&
                    agentPresets.map((preset) => (
                      <Box key={preset.id} alignItems='center' justifyContent='space-between' gap={6}>
                        <Box alignItems='center' gap={6} minWidth={0}>
                          <Box width={22} height={22} border='1px solid #2e3f66' overflow='hidden' flexShrink={0}>
                            <img
                              src={getAgentPresetAvatar(preset)}
                              alt={preset.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                            />
                          </Box>
                          <Text as='span' color='$textGold' font='$pixel' fontSize='0.62rem'>
                            {preset.name}
                          </Text>
                        </Box>
                        <Button
                          size='sm'
                          variant='outline'
                          radius='sm'
                          font='$pixel'
                          fontSize='0.68rem'
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

                  {!isLoadingAgents &&
                    agentEntities.map((agent) => (
                      <Box key={agent.id} alignItems='center' justifyContent='space-between' gap={6}>
                        <Box alignItems='center' gap={6} minWidth={0}>
                          <Box width={22} height={22} border='1px solid #2e3f66' overflow='hidden' flexShrink={0}>
                            <img
                              src={getAgentEntityAvatar(agent)}
                              alt={agent.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                            />
                          </Box>
                          <Text as='span' color='$textGold' font='$pixel' fontSize='0.62rem'>
                            {agent.name}
                          </Text>
                        </Box>
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

            {activePanel === 'mobs' && (
              <Box flexDirection='column' gap={6}>
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

                  {!isLoadingMobs &&
                    mobPresets.map((preset) => (
                      <Box key={preset.id} alignItems='center' justifyContent='space-between' gap={6}>
                        <Box alignItems='center' gap={6} minWidth={0}>
                          <Box width={22} height={22} border='1px solid #2e3f66' overflow='hidden' flexShrink={0}>
                            <img
                              src={getMobPresetAvatar(preset)}
                              alt={preset.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                            />
                          </Box>
                          <Text as='span' color='$textGold' font='$pixel' fontSize='0.62rem'>
                            {preset.name}
                          </Text>
                        </Box>
                        <Button
                          size='sm'
                          variant='outline'
                          radius='sm'
                          font='$pixel'
                          fontSize='0.68rem'
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
                        <Box alignItems='center' gap={6} minWidth={0}>
                          <Box width={22} height={22} border='1px solid #2e3f66' overflow='hidden' flexShrink={0}>
                            <img
                              src={getMobEntityAvatar(mob)}
                              alt={mob.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                            />
                          </Box>
                          <Text as='span' color='$textGold' font='$pixel' fontSize='0.62rem'>
                            {mob.name}
                          </Text>
                        </Box>
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
        </div>
      )}
    </>
  );
};
