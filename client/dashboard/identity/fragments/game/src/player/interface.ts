export interface PlayerPosition {
  x: number;
  y: number;
}

export interface PlayerData {
  id: string;
  position: PlayerPosition;
  size: number;
  color: string;
}

export const mockPlayer: PlayerData = {
  id: 'player-1',
  position: { x: 50, y: 50 },
  size: 24,
  color: 'var(--ui-color-accentGreen, #5aaa2a)',
};
