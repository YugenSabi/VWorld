import type { Agent } from '../schemas';

export const MOCK_AGENTS: Agent[] = [
  {
    id: 1,
    name: 'Danek',
    mood: 'friendly',
    personality: 'Cheerful and optimistic',
    current_plan: 'Exploring the world',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    name: 'Sanek',
    mood: 'neutral',
    personality: 'Calm and thoughtful',
    current_plan: 'Reading a book',
    created_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 3,
    name: 'Semen',
    mood: 'angry',
    personality: 'Short-tempered',
    current_plan: 'Looking for trouble',
    created_at: '2024-01-15T09:45:00Z',
  },
];

export const USE_MOCK_AGENTS = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
