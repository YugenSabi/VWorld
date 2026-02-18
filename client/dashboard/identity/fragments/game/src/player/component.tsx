'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import char1Idle from '@shared/characters/char_1/beadwork-cross-stitch-pixel-art-pattern-people-dance-d2d7111f4ce5dc01915ceb14d47243a8.png';
import char2Idle from '@shared/characters/char_2/char2.png';
import char3Idle from '@shared/characters/char_3/char3.png';
import mob1 from '@shared/mobs/mob_1/cat-minecraft-anime-manga-color-by-number-pixel-art-coloring-bead-husky-dog-f7401d42da5ac56d0bcfabdcae54f435.png';
import mob2 from '@shared/mobs/mob_2/pixel-art-drawing-pixelation-dog-dog-952116381da75340b19b023c73ef8bcd.png';
import mob3 from '@shared/mobs/mob_3/cat-kitten-pixel-art-cat-1aff464dfe4364a01019b92731bf5252.png';

export interface AgentOnMap {
  id: number;
  name: string;
  type?: string;
  x: number;
  y: number;
  mood: string;
  bubble?: string | null;
}

interface PlayersComponentProps {
  agents?: AgentOnMap[];
  inspectedAgentId?: number | null;
  onInspectAgent?: (agentId: number) => void;
}

const AGENT_COLORS = [
  '#5aaa2a',
  '#2a7aaa',
  '#aa5a2a',
  '#aa2a7a',
  '#7a2aaa',
  '#2aaa5a',
  '#aa7a2a',
  '#2a5aaa',
];

function getAgentColor(id: number): string {
  return AGENT_COLORS[id % AGENT_COLORS.length];
}

function resolveSprite(agent: AgentOnMap): string {
  if ((agent.type || 'agent') === 'mob') {
    const normalized = (agent.name || '').toLowerCase().trim();
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
  const normalized = (agent.name || '').toLowerCase().trim();
  if (normalized.includes('mira')) {
    return (char1Idle as { src: string }).src;
  }
  if (normalized.includes('dorian')) {
    return (char2Idle as { src: string }).src;
  }
  if (normalized.includes('lyra')) {
    return (char3Idle as { src: string }).src;
  }
  const agentSprites = [
    (char1Idle as { src: string }).src,
    (char2Idle as { src: string }).src,
    (char3Idle as { src: string }).src,
  ];
  return agentSprites[agent.id % agentSprites.length];
}

function AgentSprite({
  agent,
  isInspected,
  onInspect,
}: {
  agent: AgentOnMap;
  isInspected: boolean;
  onInspect?: (agentId: number) => void;
}) {
  const color = getAgentColor(agent.id);
  const [ready, setReady] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Box
      position='absolute'
      left={`${agent.x}%`}
      top={`${agent.y}%`}
      transform='translate(-50%, -50%)'
      flexDirection='column'
      alignItems='center'
      style={{
        pointerEvents: 'auto',
        zIndex: 10,
        transition: ready ? 'left 0.45s linear, top 0.45s linear' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onInspect?.(agent.id)}
    >
      {agent.bubble && (
        <Box
          position='relative'
          marginBottom={4}
          padding='3px 6px'
          backgroundColor='rgba(0, 0, 0, 0.82)'
          border={`1px solid ${color}`}
          maxWidth={140}
          style={{
            animation: 'fadeInBubble 0.3s ease-in',
          }}
        >
          <Text
            as='span'
            color='#fff'
            font='$pixel'
            fontSize='0.45rem'
            letterSpacing='0.3px'
            style={{
              wordBreak: 'break-word',
              lineHeight: '1.3',
            }}
          >
            {agent.bubble.length > 60
              ? agent.bubble.substring(0, 57) + '...'
              : agent.bubble}
          </Text>
          <Box
            position='absolute'
            bottom={-5}
            left='50%'
            transform='translateX(-50%)'
            width={0}
            height={0}
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `5px solid ${color}`,
            }}
          />
        </Box>
      )}

      <span
        style={{
          color: '#fff',
          fontFamily: 'var(--ui-font-pixel, monospace)',
          fontSize: '0.42rem',
          letterSpacing: '0.5px',
          textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
          marginBottom: 2,
        }}
      >
        {agent.name}
      </span>

      <img
        src={resolveSprite(agent)}
        alt={agent.name}
        style={{
          width: 40,
          height: 40,
          objectFit: 'cover',
          imageRendering: 'pixelated',
          filter: (agent.type || 'agent') === 'mob' ? 'saturate(1.05)' : 'none',
          border: isHovered || isInspected ? '2px solid #ffffff' : '2px solid transparent',
          boxShadow: isHovered || isInspected ? '0 0 10px rgba(255,255,255,0.9)' : 'none',
          cursor: 'pointer',
        }}
      />
    </Box>
  );
}


export const PlayerComponent = ({ agents = [], inspectedAgentId = null, onInspectAgent }: PlayersComponentProps) => {
  if (agents.length === 0) return null;

  return (
    <>
      {agents.map((agent) => (
        <AgentSprite
          key={agent.id}
          agent={agent}
          isInspected={agent.id === inspectedAgentId}
          onInspect={onInspectAgent}
        />
      ))}

      <style>{`
        @keyframes fadeInBubble {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};
