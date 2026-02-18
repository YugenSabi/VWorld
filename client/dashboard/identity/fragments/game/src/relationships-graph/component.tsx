'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { relationshipsService } from '@/api';
import type { RelationshipGraph } from '@/schemas';

const SVG_SIZE = 230;
const CENTER = SVG_SIZE / 2;
const RADIUS = 78;

type NodePosition = {
  x: number;
  y: number;
};

function clampSympathy(value: number): number {
  return Math.max(-10, Math.min(10, value));
}

export const RelationshipsGraphComponent = () => {
  const [graph, setGraph] = useState<RelationshipGraph>({ nodes: [], edges: [] });
  const [error, setError] = useState<string | null>(null);

  const loadGraph = useCallback(async () => {
    try {
      const response = await relationshipsService.getAllRelationships();
      setGraph(response);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load graph');
    }
  }, []);

  useEffect(() => {
    loadGraph();
    const intervalId = setInterval(loadGraph, 5000);
    return () => clearInterval(intervalId);
  }, [loadGraph]);

  const positions = useMemo<Record<number, NodePosition>>(() => {
    if (graph.nodes.length === 0) {
      return {};
    }

    const angleStep = (Math.PI * 2) / graph.nodes.length;
    return graph.nodes.reduce<Record<number, NodePosition>>((acc, node, index) => {
      const angle = -Math.PI / 2 + index * angleStep;
      acc[node.id] = {
        x: CENTER + Math.cos(angle) * RADIUS,
        y: CENTER + Math.sin(angle) * RADIUS,
      };
      return acc;
    }, {});
  }, [graph.nodes]);

  const stats = useMemo(() => {
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    for (const edge of graph.edges) {
      if (edge.sympathy > 1) {
        positive += 1;
      } else if (edge.sympathy < -1) {
        negative += 1;
      } else {
        neutral += 1;
      }
    }

    return { positive, negative, neutral };
  }, [graph.edges]);

  return (
    <Box
      flexDirection='column'
      width={230}
      gap={8}
      padding='12px 12px 10px'
      background='linear-gradient(180deg, #0f1a2d 0%, #0a1221 100%)'
      border='2px solid #2e3f66'
      boxShadow='0 12px 26px rgba(0, 0, 0, 0.45)'
    >
      <Box alignItems='center' justifyContent='space-between'>
        <Text as='span' color='$textGold' font='$pixel' fontSize='0.66rem' letterSpacing='1px'>
          RELATION GRAPH
        </Text>
        <Text as='span' color='$textMuted' font='$pixel' fontSize='0.48rem'>
          {graph.nodes.length} nodes
        </Text>
      </Box>

      <Box alignItems='center' justifyContent='center' background='rgba(14, 22, 38, 0.7)' border='1px solid #2c3f66' padding={6}>
        <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
          {graph.edges.map((edge, index) => {
            const from = positions[edge.from_id];
            const to = positions[edge.to_id];
            if (!from || !to) {
              return null;
            }

            const sympathy = clampSympathy(edge.sympathy);
            const lineColor = sympathy > 1 ? '#49d17d' : sympathy < -1 ? '#f87171' : '#93a2be';
            const strokeWidth = 1 + Math.abs(sympathy) * 0.18;

            return (
              <line
                key={`edge-${index}-${edge.from_id}-${edge.to_id}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={lineColor}
                strokeWidth={strokeWidth}
                strokeOpacity={0.9}
              />
            );
          })}

          {graph.nodes.map((node) => {
            const position = positions[node.id];
            if (!position) {
              return null;
            }

            return (
              <g key={node.id}>
                <circle cx={position.x} cy={position.y} r={13} fill='#1f4e95' stroke='#70b3ff' strokeWidth={2} />
                <text
                  x={position.x}
                  y={position.y + 3}
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
        <Text as='div' color='$textMuted' font='$pixel' fontSize='0.52rem'>
          + friendly: {stats.positive}
        </Text>
        <Text as='div' color='$textMuted' font='$pixel' fontSize='0.52rem'>
          - hostile: {stats.negative}
        </Text>
        <Text as='div' color='$textMuted' font='$pixel' fontSize='0.52rem'>
          = neutral: {stats.neutral}
        </Text>
      </Box>

      {error && (
        <Text as='div' color='$error' font='$pixel' fontSize='0.5rem'>
          {error}
        </Text>
      )}
    </Box>
  );
};
