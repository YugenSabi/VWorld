import type { Agent } from '../schemas';

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-1',
    name: 'Danek',
    mood: 'Friendly',
    level: 5,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'agent-2',
    name: 'Sanek',
    mood: 'Friendly',
    level: 3,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'agent-3',
    name: 'Semen',
    mood: 'Angry',
    level: 7,
    createdAt: '2024-01-15T09:45:00Z',
    updatedAt: '2024-01-15T09:45:00Z',
  },
];

export const USE_MOCK_AGENTS = true;
