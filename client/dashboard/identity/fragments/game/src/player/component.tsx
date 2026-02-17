'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export interface AgentOnMap {
  id: number;
  name: string;
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

      {/* Agent body (colored square) */}
      <Box
        width={20}
        height={20}
        backgroundColor={color}
        border={`2px solid ${color}88`}
        boxShadow={`0 0 8px ${color}66`}
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
