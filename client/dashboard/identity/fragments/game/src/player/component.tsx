'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import char1Idle from '@shared/characters/char_1/beadwork-cross-stitch-pixel-art-pattern-people-dance-d2d7111f4ce5dc01915ceb14d47243a8.png';
import char2Idle from '@shared/characters/char_2/—Pngtree—pixel beauty_4758536.png';
import char3Idle from '@shared/characters/char_3/—Pngtree—pixel art character young boy_7325574.png';
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
    const mobSprites = [
      (mob1 as { src: string }).src,
      (mob2 as { src: string }).src,
      (mob3 as { src: string }).src,
    ];
    return mobSprites[agent.id % mobSprites.length];
  }
  const agentSprites = [
    (char1Idle as { src: string }).src,
    (char2Idle as { src: string }).src,
    (char3Idle as { src: string }).src,
  ];
  return agentSprites[agent.id % agentSprites.length];
}

/* ── Single Agent on Map ── */

function AgentSprite({ agent }: { agent: AgentOnMap }) {
  const [offsetX, setOffsetX] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const step = 1;
    const range = 4;
    const interval = setInterval(() => {
      setOffsetX((prev) => {
        const next = prev + step * direction;
        if (next >= range || next <= -range) {
          setDirection((d) => d * -1);
        }
        return next;
      });
    }, 150 + (agent.id % 5) * 20);

    return () => clearInterval(interval);
  }, [direction, agent.id]);

  const color = getAgentColor(agent.id);

  return (
    <Box
      position='absolute'
      left={`calc(${agent.x}% + ${offsetX}px)`}
      top={`${agent.y}%`}
      transform='translate(-50%, -50%)'
      flexDirection='column'
      alignItems='center'
      style={{ pointerEvents: 'none', zIndex: 10 }}
    >
      {/* Speech/thought bubble */}
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
          {/* Bubble triangle */}
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

      {/* Agent name */}
      <Text
        as='span'
        color='#fff'
        font='$pixel'
        fontSize='0.42rem'
        letterSpacing='0.5px'
        textShadow='1px 1px 2px rgba(0,0,0,0.9)'
        marginBottom={2}
      >
        {agent.name}
      </Text>

      {/* Agent body */}
      <Box
        width={26}
        height={26}
        border={`1px solid ${color}88`}
        boxShadow={`0 0 8px ${color}66`}
        overflow='hidden'
        backgroundColor='rgba(0,0,0,0.35)'
      />
      <img
        src={resolveSprite(agent)}
        alt={agent.name}
        style={{
          position: 'absolute',
          bottom: 0,
          width: 26,
          height: 26,
          objectFit: 'cover',
          imageRendering: 'pixelated',
          filter: (agent.type || 'agent') === 'mob' ? 'saturate(1.05)' : 'none',
        }}
      />
    </Box>
  );
}

/* ── All Players on Map ── */

export const PlayerComponent = ({ agents = [] }: PlayersComponentProps) => {
  if (agents.length === 0) return null;

  return (
    <>
      {agents.map((agent) => (
        <AgentSprite key={agent.id} agent={agent} />
      ))}

      {/* Bubble animation keyframes */}
      <style>{`
        @keyframes fadeInBubble {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};
