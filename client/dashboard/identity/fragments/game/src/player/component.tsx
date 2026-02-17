'use client';

import { useState, useEffect } from 'react';
import { Box } from '@ui/layout';

interface PlayerPosition {
  x: number;
  y: number;
}

interface PlayerData {
  id: string;
  name: string;
  position: PlayerPosition;
  size: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

const mockPlayer: PlayerData = {
  id: 'player-1',
  name: 'Player',
  position: { x: 50, y: 50 },
  size: 24,
  color: 'var(--ui-color-accentGreen, #5aaa2a)',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface PlayerComponentProps {
  data?: PlayerData;
}

export const PlayerComponent = ({ data = mockPlayer }: PlayerComponentProps) => {
  const [offsetX, setOffsetX] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const step = 1;
    const range = 6;
    const interval = setInterval(() => {
      setOffsetX((prev) => {
        const next = prev + step * direction;
        if (next >= range || next <= -range) {
          setDirection((d) => d * -1);
        }
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [direction]);

  return (
    <Box
      position='absolute'
      left={`calc(${data.position.x}% + ${offsetX}px)`}
      top={`${data.position.y}%`}
      width={data.size}
      height={data.size}
      backgroundColor={data.color}
      border='2px solid var(--ui-color-accentGreenDark, #3a7a1a)'
      boxShadow='0 0 8px rgba(90, 170, 42, 0.4)'
      transform='translate(-50%, -50%)'
    />
  );
};
