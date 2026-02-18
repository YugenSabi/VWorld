'use client';

import { useMemo, useState } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { useRealtimeAgents } from '@/hooks';


type CommEdge = {
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;
  count: number;
};

type AgentNode = {
  id: number;
  name: string;
  type: string;
};

const SVG_SIZE = 230;
const CENTER = SVG_SIZE / 2;
const RADIUS = 78;

export const CommunicationsGraphComponent = () => {
  const [edgesMap, setEdgesMap] = useState<Record<string, CommEdge>>({});
  const [nodesMap, setNodesMap] = useState<Record<number, AgentNode>>({});

  useRealtimeAgents({
    onAgentCreated: (agent) => {
      setNodesMap((prev) => ({
        ...prev,
        [agent.id]: { id: agent.id, name: agent.name, type: agent.type || 'agent' },
      }));
    },
    onAgentsUpdate: (agents) => {
      setNodesMap((prev) => {
        const next = { ...prev };
        for (const a of agents) {
          next[a.id] = { id: a.id, name: a.name, type: a.type || 'agent' };
        }
        return next;
      });
    },
    onAgentDeleted: (agentId) => {
      setNodesMap((prev) => {
        const next = { ...prev };
        delete next[agentId];
        return next;
      });
      setEdgesMap((prev) => {
        const next: Record<string, CommEdge> = {};
        for (const [key, edge] of Object.entries(prev)) {
          if (edge.fromId !== agentId && edge.toId !== agentId) {
            next[key] = edge;
          }
        }
        return next;
      });
    },
    onAgentDialogue: (data) => {
      const node1 = nodesMap[data.agentId1];
      const node2 = nodesMap[data.agentId2];
      if ((node1 && node1.type === 'mob') || (node2 && node2.type === 'mob')) {
        return;
      }
      const key = `${data.agentId1}-${data.agentId2}`;
      setNodesMap((prev) => ({
        ...prev,
        [data.agentId1]: {
          id: data.agentId1,
          name: data.name1,
          type: prev[data.agentId1]?.type || 'agent',
        },
        [data.agentId2]: {
          id: data.agentId2,
          name: data.name2,
          type: prev[data.agentId2]?.type || 'agent',
        },
      }));
      setEdgesMap((prev) => {
        const current = prev[key];
        return {
          ...prev,
          [key]: {
            fromId: data.agentId1,
            toId: data.agentId2,
            fromName: data.name1,
            toName: data.name2,
            count: current ? current.count + 1 : 1,
          },
        };
      });
    },
    enabled: true,
  });

  const nodes = useMemo(
    () => Object.values(nodesMap).filter((node) => node.type === 'agent'),
    [nodesMap]
  );
  const edges = useMemo(
    () => Object.values(edgesMap).sort((a, b) => b.count - a.count).slice(0, 12),
    [edgesMap]
  );

  const maxCount = useMemo(() => edges.reduce((acc, edge) => Math.max(acc, edge.count), 1), [edges]);

  const positions = useMemo<Record<number, { x: number; y: number }>>(() => {
    if (nodes.length === 0) return {};
    const angleStep = (Math.PI * 2) / nodes.length;
    return nodes.reduce<Record<number, { x: number; y: number }>>((acc, node, index) => {
      const angle = -Math.PI / 2 + index * angleStep;
      acc[node.id] = {
        x: CENTER + Math.cos(angle) * RADIUS,
        y: CENTER + Math.sin(angle) * RADIUS,
      };
      return acc;
    }, {});
  }, [nodes]);

  return (
    <Box
      flexDirection='column'
      width={230}
      gap={8}
      padding='12px 12px 10px'
      background='linear-gradient(180deg, #111f35 0%, #0a1425 100%)'
      border='2px solid #2e3f66'
      boxShadow='0 12px 26px rgba(0, 0, 0, 0.45)'
    >
      <Box alignItems='center' justifyContent='space-between'>
        <Text as='span' color='$textGold' font='$pixel' fontSize='0.66rem' letterSpacing='1px'>
          COMMS GRAPH
        </Text>
        <Text as='span' color='$textMuted' font='$pixel' fontSize='0.48rem'>
          {edges.length} links
        </Text>
      </Box>

      <Box alignItems='center' justifyContent='center' background='rgba(14, 22, 38, 0.7)' border='1px solid #2c3f66' padding={6}>
        <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
          {edges.map((edge) => {
            const from = positions[edge.fromId];
            const to = positions[edge.toId];
            if (!from || !to) return null;
            const strength = edge.count / maxCount;
            const strokeWidth = 1 + 3 * strength;
            const opacity = 0.45 + 0.5 * strength;
            return (
              <line
                key={`${edge.fromId}-${edge.toId}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke='#60a5fa'
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
              />
            );
          })}

          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            return (
              <g key={node.id}>
                <circle cx={pos.x} cy={pos.y} r={12} fill='#0f4d86' stroke='#7ec8ff' strokeWidth={2} />
                <text
                  x={pos.x}
                  y={pos.y + 3}
                  textAnchor='middle'
                  fontSize='8'
                  fill='#f3f5fb'
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  {node.name.slice(0, 1).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>

      <Box flexDirection='column' gap={4}>
        {edges.length === 0 && (
          <Text as='div' color='$textMuted' font='$pixel' fontSize='0.52rem'>
            No live dialogues yet
          </Text>
        )}
        {edges.slice(0, 4).map((edge) => (
          <Text key={`${edge.fromId}-${edge.toId}-label`} as='div' color='$textMuted' font='$pixel' fontSize='0.5rem'>
            {edge.fromName}{' -> '}{edge.toName}: {edge.count}
          </Text>
        ))}
      </Box>
    </Box>
  );
};
