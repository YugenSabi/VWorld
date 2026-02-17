export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 15000,
} as const;

export const API_ENDPOINTS = {
  agents: {
    list: '/agents',
    byId: (id: string) => `/agents/${id}`,
    profile: (id: string) => `/agents/${id}/profile`,
    relationships: (id: string) => `/agents/${id}/relationships`,
    create: '/agents',
    update: (id: string) => `/agents/${id}`,
    delete: (id: string) => `/agents/${id}`,
    mood: (id: string) => `/agents/${id}/mood`,
  },

  memory: {
    add: (agentId: string) => `/agents/${agentId}/memory`,
    list: (agentId: string) => `/agents/${agentId}/memory`,
    summary: (agentId: string) => `/agents/${agentId}/memory/summary`,
  },

  events: {
    list: '/events',
    create: '/events',
  },

  relationships: {
    list: '/relationships',
    create: '/relationships',
    byAgent: (agentId: string) => `/relationships/agents/${agentId}`,
  },

  environment: {
    weather: '/environment/weather',
    speed: '/environment/speed',
    event: '/environment/event',
  },

  locations: {
    list: '/locations',
    byId: (id: string) => `/locations/${id}`,
    current: '/locations/current',
  },

  characters: {
    list: '/characters',
    byId: (id: string) => `/characters/${id}`,
    byLocation: (locationId: string) => `/locations/${locationId}/characters`,
  },
} as const;

export function buildApiUrl(endpoint: string): string {
  const base = API_CONFIG.baseUrl;
  const cleanBase = base.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanBase}/${cleanEndpoint}`;
}
